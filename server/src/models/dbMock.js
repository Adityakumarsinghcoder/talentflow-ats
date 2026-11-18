import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve('src/.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Generate unique ObjectId-like strings
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

class QueryBuilder {
  constructor(query, model) {
    this.query = query;
    this.model = model;
    this._populatePaths = [];
    this._sortField = null;
    this._selectFields = null;
  }

  populate(pathStr, selectStr) {
    this._populatePaths.push({ path: pathStr, select: selectStr });
    return this;
  }

  sort(sortObj) {
    this._sortField = sortObj;
    return this;
  }

  select(selectStr) {
    this._selectFields = selectStr;
    return this;
  }

  async exec() {
    const data = this.model._read();
    
    // Perform filtering
    let output = data.filter(item => {
      for (const [key, value] of Object.entries(this.query)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Mongoose query modifiers
          if (value.$regex) {
            const options = value.$options || '';
            const regex = new RegExp(value.$regex, options);
            if (!regex.test(item[key] || '')) return false;
          } else if (value.$in) {
            const itemVal = item[key];
            const inArray = value.$in;
            const matches = inArray.some(val => {
              if (val instanceof RegExp) return val.test(itemVal || '');
              if (Array.isArray(itemVal)) return itemVal.some(i => i.toLowerCase() === val.toString().toLowerCase());
              return itemVal === val;
            });
            if (!matches) return false;
          }
        } else if (Array.isArray(item[key])) {
          if (value && !item[key].includes(value)) return false;
        } else if (this.query[key] !== undefined) {
          let itemVal = item[key];
          if (itemVal && typeof itemVal === 'object' && itemVal._id) {
            itemVal = itemVal._id;
          }
          if (itemVal?.toString() !== value?.toString()) return false;
        }
      }
      return true;
    });

    // Handle sort
    if (this._sortField) {
      const field = typeof this._sortField === 'string' ? this._sortField : Object.keys(this._sortField)[0];
      const direction = typeof this._sortField === 'string' ? -1 : this._sortField[field]; // -1 desc, 1 asc
      
      output.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        if (field === 'createdAt' || field === 'appliedDate' || field === 'date') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }

        if (valA < valB) return direction === 1 ? -1 : 1;
        if (valA > valB) return direction === 1 ? 1 : -1;
        return 0;
      });
    }

    // Helper function for recursive populate
    const populateDoc = (item, refField, selectStr, nestedPop) => {
      const idToFind = item[refField];
      if (!idToFind) return item;

      // Determine referencing model
      let refModelName = null;
      if (refField === 'companyId') refModelName = 'Company';
      else if (refField === 'recruiterId' || refField === 'candidateId' || refField === 'interviewerId' || refField === 'userId') refModelName = 'User';
      else if (refField === 'jobId') refModelName = 'Job';
      else if (refField === 'applicationId') refModelName = 'Application';
      else if (refField === 'interviewId') refModelName = 'Interview';

      if (!refModelName) return item;

      const refModel = new MockModel(refModelName);
      const refData = refModel._read();

      const targetId = idToFind._id ? idToFind._id : idToFind;
      const foundRef = refData.find(r => r._id.toString() === targetId.toString());
      if (!foundRef) return item;

      let popObj = { ...foundRef };

      // Handle nested populate
      if (nestedPop) {
        const nestedArray = Array.isArray(nestedPop) ? nestedPop : [nestedPop];
        for (const subPop of nestedArray) {
          let subField = subPop.path;
          let subSelect = subPop.select;
          let subNested = subPop.populate;
          if (subField && typeof subField === 'object') {
            subNested = subField.populate;
            subSelect = subField.select;
            subField = subField.path;
          }
          popObj = populateDoc(popObj, subField, subSelect, subNested);
        }
      }

      // Handle select filtering
      if (selectStr) {
        const selectFields = selectStr.split(' ').map(f => f.trim()).filter(Boolean);
        const filteredPop = {};
        selectFields.forEach(f => {
          if (f.startsWith('-')) {
            const realField = f.substring(1);
            delete popObj[realField];
          } else {
            filteredPop[f] = popObj[f];
          }
        });
        if (Object.keys(filteredPop).length > 0) {
          popObj = { _id: popObj._id, ...filteredPop };
        }
      }

      return {
        ...item,
        [refField]: popObj,
      };
    };

    // Handle populate
    for (const pop of this._populatePaths) {
      let refField = pop.path;
      let selectStr = pop.select;
      let nestedPop = null;

      if (refField && typeof refField === 'object') {
        nestedPop = refField.populate;
        selectStr = refField.select;
        refField = refField.path;
      }

      if (refField) {
        output = output.map(item => populateDoc(item, refField, selectStr, nestedPop));
      }
    }

    // Handle select (specifically password exclusion)
    if (this._selectFields && typeof this._selectFields === 'string') {
      const selectFields = this._selectFields.split(' ').map(f => f.trim()).filter(Boolean);
      output = output.map(item => {
        const newItem = { ...item };
        selectFields.forEach(f => {
          if (f.startsWith('-')) {
            const fieldToDel = f.substring(1);
            delete newItem[fieldToDel];
          }
        });
        return newItem;
      });
    }

    // Map back to document objects with methods like save()
    return output.map(item => this.model._wrapDocument(item));
  }

  // Allow then/catch directly for promise-like await
  then(onfulfilled, onrejected) {
    return this.exec().then(onfulfilled, onrejected);
  }
}

export class MockModel {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name.toLowerCase()}s.json`);
    console.log(`[MOCK DB] Instantiating model ${name} at ${this.filePath}`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
    this._checkAndSeed();
  }

  _checkAndSeed() {
    try {
      const data = this._read();
      if (data.length > 0) return; // Already has data

      if (this.name === 'Company') {
        const defaultCompanies = [
          {
            _id: "company_seed_id_100",
            companyName: "TalentFlow Corp",
            industry: "SaaS & Software",
            website: "https://talentflow.co",
            recruitersCount: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        this._write(defaultCompanies);
      } else if (this.name === 'User') {
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync("password123", salt);
        const defaultUsers = [
          {
            _id: "user_seed_id_recruiter_200",
            name: "Sarah Recruiter",
            email: "recruiter@talentflow.com",
            password: hashedPassword,
            role: "COMPANY_ADMIN",
            companyId: "company_seed_id_100",
            avatar: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: "user_seed_id_candidate_300",
            name: "Alex Developer",
            email: "candidate@talentflow.com",
            password: hashedPassword,
            role: "CANDIDATE",
            companyId: null,
            avatar: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        this._write(defaultUsers);
      } else if (this.name === 'Job') {
        const defaultJobs = [
          {
            _id: "job_seed_id_400",
            title: "Senior React Engineer",
            description: "Looking for a Senior React developer to lead the frontend development of our flagship product.",
            skillsRequired: ["React", "Redux", "Tailwind CSS", "TypeScript"],
            salaryRange: "$120k - $145k",
            experienceRequired: "3 years",
            location: "Remote",
            employmentType: "FULL_TIME",
            companyId: "company_seed_id_100",
            status: "OPEN",
            openings: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        this._write(defaultJobs);
      } else if (this.name === 'Resume') {
        const defaultResumes = [
          {
            _id: "resume_seed_id_500",
            candidateId: "user_seed_id_candidate_300",
            fileUrl: "/uploads/demo_resume.pdf",
            parsedData: {
              name: "Alex Developer",
              email: "candidate@talentflow.com",
              phone: "555-0199",
              skills: ["React", "Redux", "Tailwind CSS", "TypeScript", "Node.js", "Javascript"],
              experience: "4 years",
              education: "Bachelor in Computer Science"
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        this._write(defaultResumes);
      }
    } catch (err) {
      console.error(`Error seeding mock data for ${this.name}:`, err);
    }
  }

  _read() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      return [];
    }
  }

  _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  _wrapDocument(data) {
    if (!data) return null;
    const self = this;
    return {
      ...data,
      get id() {
        return this._id ? this._id.toString() : undefined;
      },
      save: async function() {
        const currentData = self._read();
        const index = currentData.findIndex(d => d._id.toString() === this._id.toString());
        
        const dataToSave = { ...this };
        delete dataToSave.save;
        delete dataToSave.deleteOne;
        delete dataToSave.comparePassword;
        delete dataToSave.id;

        // Revert populated fields to their IDs before saving to keep database normalized
        const refFields = ['companyId', 'recruiterId', 'candidateId', 'interviewerId', 'userId', 'jobId', 'applicationId', 'interviewId', 'senderId', 'receiverId'];
        refFields.forEach(field => {
          if (dataToSave[field] && typeof dataToSave[field] === 'object') {
            dataToSave[field] = dataToSave[field]._id ? dataToSave[field]._id.toString() : (dataToSave[field].id ? dataToSave[field].id.toString() : dataToSave[field]);
          }
        });

        // Secure password hashing for updates
        if (self.name === 'User' && dataToSave.password && !dataToSave.password.startsWith('$2a$') && !dataToSave.password.startsWith('$2b$')) {
          const salt = await bcrypt.genSalt(10);
          dataToSave.password = await bcrypt.hash(dataToSave.password, salt);
        }

        dataToSave.updatedAt = new Date().toISOString();

        if (index !== -1) {
          currentData[index] = dataToSave;
        } else {
          dataToSave.createdAt = dataToSave.createdAt || new Date().toISOString();
          currentData.push(dataToSave);
        }
        self._write(currentData);
        return self._wrapDocument(dataToSave);
      },
      deleteOne: async function() {
        const currentData = self._read();
        const filtered = currentData.filter(d => d._id.toString() !== this._id.toString());
        self._write(filtered);
        return { deletedCount: 1 };
      },
      comparePassword: async function(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
      }
    };
  }

  find(query = {}) {
    return new QueryBuilder(query, this);
  }

  findOne(query = {}) {
    const self = this;
    const qb = new QueryBuilder(query, this);
    qb.exec = async function() {
      // Propagate builder chain parameters down to executor
      const findQb = new QueryBuilder(this.query, self);
      findQb._populatePaths = this._populatePaths;
      findQb._sortField = this._sortField;
      findQb._selectFields = this._selectFields;

      const results = await findQb.exec();
      const doc = results[0] || null;
      if (doc && this._selectFields && typeof this._selectFields === 'string') {
        const selectFields = this._selectFields.split(' ').map(f => f.trim()).filter(Boolean);
        selectFields.forEach(f => {
          if (f.startsWith('-')) {
            const fieldToDel = f.substring(1);
            delete doc[fieldToDel];
          }
        });
      }
      return doc;
    };
    return qb;
  }

  findById(id) {
    if (!id) {
      const qb = new QueryBuilder({ _id: 'nonexistent' }, this);
      qb.exec = async () => null;
      return qb;
    }
    return this.findOne({ _id: id.toString() });
  }

  async create(data) {
    const currentData = this._read();
    
    // Secure password hashing on create
    let finalData = { ...data };
    if (this.name === 'User' && finalData.password) {
      const salt = await bcrypt.genSalt(10);
      finalData.password = await bcrypt.hash(finalData.password, salt);
    }

    const newDoc = {
      _id: generateId(),
      ...finalData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    currentData.push(newDoc);
    this._write(currentData);
    return this._wrapDocument(newDoc);
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    const currentData = this._read();
    const index = currentData.findIndex(d => d._id.toString() === id.toString());
    if (index === -1) return null;

    const updated = {
      ...currentData[index],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    currentData[index] = updated;
    this._write(currentData);
    return this._wrapDocument(updated);
  }

  countDocuments(query = {}) {
    const self = this;
    const qb = new QueryBuilder(query, this);
    qb.exec = async function() {
      const findQb = new QueryBuilder(this.query, self);
      findQb._populatePaths = this._populatePaths;
      findQb._sortField = this._sortField;
      findQb._selectFields = this._selectFields;

      const results = await findQb.exec();
      return results.length;
    };
    return qb;
  }
}
