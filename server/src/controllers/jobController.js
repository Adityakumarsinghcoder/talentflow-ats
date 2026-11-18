import Job from '../models/Job.js';
import ActivityLog from '../models/ActivityLog.js';
import jwt from 'jsonwebtoken';
import { generateQuestionsForJob, generateJDText } from '../services/geminiService.js';

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (SUPER_ADMIN, COMPANY_ADMIN, RECRUITER)
export const createJob = async (req, res) => {
  try {
    const { title, description, skillsRequired, salaryRange, experienceRequired, location, employmentType, openings, screeningQuestions } = req.body;

    if (!title || !description || !skillsRequired) {
      return res.status(400).json({ message: 'Title, description, and skills are required' });
    }

    if (!req.user.companyId && req.user.role !== 'SUPER_ADMIN') {
      return res.status(400).json({ message: 'User is not associated with any company' });
    }

    // Parse skills if string
    const skillsArray = Array.isArray(skillsRequired) 
      ? skillsRequired 
      : skillsRequired.split(',').map(s => s.trim());

    const job = await Job.create({
      title,
      description,
      skillsRequired: skillsArray,
      salaryRange: salaryRange || '',
      experienceRequired: experienceRequired || '',
      location: location || '',
      employmentType: employmentType || 'FULL_TIME',
      companyId: req.user.companyId,
      recruiterId: req.user.id,
      status: 'OPEN',
      openings: openings || 1,
      screeningQuestions: screeningQuestions || [],
    });

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: 'CREATE_JOB',
      targetType: 'Job',
      targetId: job._id,
    });

    res.status(201).json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating job', error: error.message });
  }
};

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public (Candidates see OPEN jobs; Recruiters see their company's jobs)
export const getJobs = async (req, res) => {
  try {
    const { status, search, companyId, location, type } = req.query;
    let query = {};

    // 1. Multi-tenant filtering for logged-in recruiters/admins
    // If user is recruiter/admin, they see their company's jobs by default
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwtSecret = process.env.JWT_SECRET || 'talentflow_access_secret_key_998877';
        const decoded = jwt.verify(token, jwtSecret);
        
        if (decoded.role === 'RECRUITER' || decoded.role === 'COMPANY_ADMIN') {
          query.companyId = decoded.companyId;
          if (status) {
            query.status = status;
          }
        }
      } catch (err) {
        // Token verification failed or expired, treat as public search
      }
    }

    // 2. Overwrite companyId if candidate or explicit search
    if (!query.companyId) {
      if (companyId) {
        query.companyId = companyId;
      }
      query.status = 'OPEN'; // Candidates only see open jobs
    }

    // 3. Status filter override (if candidate query, force open)
    if (status && !query.companyId) {
      query.status = 'OPEN';
    }

    // 4. Text Search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skillsRequired: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // 5. Additional filters
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (type) {
      query.employmentType = type;
    }

    const jobs = await Job.find(query)
      .populate('companyId', 'companyName logo industry website')
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving jobs', error: error.message });
  }
};

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('companyId', 'companyName logo industry website description address')
      .populate('recruiterId', 'name email');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving job details', error: error.message });
  }
};

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private (COMPANY_ADMIN, RECRUITER)
export const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Tenancy Check: Verify this job belongs to the user's company (unless Super Admin)
    if (req.user.role !== 'SUPER_ADMIN' && job.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ message: 'Access denied: cannot modify another company’s job' });
    }

    const { title, description, skillsRequired, salaryRange, experienceRequired, location, employmentType, status, openings, screeningQuestions } = req.body;

    if (title) job.title = title;
    if (description) job.description = description;
    if (salaryRange !== undefined) job.salaryRange = salaryRange;
    if (experienceRequired !== undefined) job.experienceRequired = experienceRequired;
    if (location !== undefined) job.location = location;
    if (employmentType) job.employmentType = employmentType;
    if (status) job.status = status;
    if (openings !== undefined) job.openings = openings;
    if (screeningQuestions !== undefined) job.screeningQuestions = screeningQuestions;

    if (skillsRequired) {
      job.skillsRequired = Array.isArray(skillsRequired)
        ? skillsRequired
        : skillsRequired.split(',').map(s => s.trim());
    }

    const updatedJob = await job.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: 'UPDATE_JOB',
      targetType: 'Job',
      targetId: job._id,
    });

    res.json(updatedJob);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating job', error: error.message });
  }
};

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private (COMPANY_ADMIN, RECRUITER)
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Tenancy Check
    if (req.user.role !== 'SUPER_ADMIN' && job.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ message: 'Access denied: cannot delete another company’s job' });
    }

    await job.deleteOne();

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: 'DELETE_JOB',
      targetType: 'Job',
      targetId: job._id,
    });

    res.json({ message: 'Job removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting job', error: error.message });
  }
};

// @desc    Generate interview questions from JD
// @route   GET /api/jobs/:id/questions
// @access  Private (COMPANY_ADMIN, RECRUITER)
export const getJobQuestions = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    const questions = await generateQuestionsForJob(job.title, job.description);
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating interview questions', error: error.message });
  }
};

// @desc    Generate Job Description
// @route   POST /api/jobs/generate-jd
// @access  Private (COMPANY_ADMIN, RECRUITER)
export const generateJD = async (req, res) => {
  try {
    const { title, experienceRequired, skillsRequired } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Job title is required' });
    }
    const description = await generateJDText(title, experienceRequired || '', skillsRequired || '');
    res.json({ description });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating job description', error: error.message });
  }
};
