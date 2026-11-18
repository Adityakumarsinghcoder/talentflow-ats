import { GoogleGenerativeAI } from '@google/generative-ai';

const hasApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;

let genAI = null;
if (hasApiKey) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.log('GEMINI_API_KEY not configured. Falling back to local Regex/Keyword parser and template generators.');
}

// ----------------------------------------------------
// 1. Resume Parser (AI with Local Regex Fallback)
// ----------------------------------------------------
export const parseResumeText = async (text) => {
  if (hasApiKey && genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `
        You are an expert AI resume parser. Analyze the resume text provided below and extract the details as a valid JSON object. 
        Only return the JSON object, do not write any markdown code blocks or additional text.
        
        JSON Schema:
        {
          "name": "Full Name",
          "email": "email@example.com",
          "phone": "Phone number",
          "skills": ["Skill1", "Skill2", "Skill3"],
          "experience": "Description of experience (e.g. 3 years)",
          "education": "Degree details (e.g. B.Tech in CS)"
        }
        
        Resume text:
        ${text}
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      // Clean possible markdown wrapper
      const jsonCleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonCleaned);
    } catch (error) {
      console.error('Gemini parsing failed, falling back to local parser:', error.message);
    }
  }

  // Local Regex / Keyword Fallback Parser
  return parseLocalResume(text);
};

const parseLocalResume = (text) => {
  const result = {
    name: 'Candidate Profile',
    email: '',
    phone: '',
    skills: [],
    experience: '0 years',
    education: 'Not specified',
  };

  // 1. Extract Email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex);
  if (emails && emails.length > 0) {
    result.email = emails[0];
  }

  // 2. Extract Phone
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex);
  if (phones && phones.length > 0) {
    result.phone = phones[0];
  }

  // 3. Extract Name (guess first line if short)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length > 0 && lines[0].length < 35 && !lines[0].includes('@')) {
    result.name = lines[0];
  }

  // 4. Extract Skills (lookup keyword match)
  const commonSkills = [
    'React', 'Node', 'MongoDB', 'Express', 'JavaScript', 'TypeScript', 'HTML', 'CSS',
    'Python', 'Django', 'Flask', 'Java', 'Spring', 'Docker', 'Kubernetes', 'AWS', 'SQL',
    'PostgreSQL', 'Git', 'Redux', 'Tailwind', 'Next.js', 'Vue', 'Angular', 'C++', 'Go'
  ];
  
  commonSkills.forEach(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const startBound = /^[a-zA-Z0-9_]/.test(skill) ? '\\b' : '';
    const endBound = /[a-zA-Z0-9_]$/.test(skill) ? '\\b' : '';
    
    const regex = new RegExp(startBound + escaped + endBound, 'i');
    if (regex.test(text)) {
      result.skills.push(skill);
    }
  });

  // 5. Extract Experience
  const expRegex = /(\d+)\+?\s*years?\s*of?\s*(?:work\s*)?experience/i;
  const expMatch = text.match(expRegex);
  if (expMatch) {
    result.experience = `${expMatch[1]} years`;
  } else {
    // try alternate pattern: "Experience: 5 years"
    const expRegex2 = /experience\s*:\s*(\d+)\s*years?/i;
    const expMatch2 = text.match(expRegex2);
    if (expMatch2) {
      result.experience = `${expMatch2[1]} years`;
    }
  }

  // 6. Extract Education
  const eduKeywords = ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'MCA', 'MBA', 'PhD', 'Bachelor', 'Master', 'University', 'College'];
  for (const keyword of eduKeywords) {
    const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (idx !== -1) {
      // Extract sentence/line containing this keyword
      const start = Math.max(0, text.lastIndexOf('\n', idx) + 1);
      const end = text.indexOf('\n', idx);
      const line = text.substring(start, end !== -1 ? end : text.length).trim();
      if (line.length < 100) {
        result.education = line;
        break;
      }
    }
  }

  return result;
};


// ----------------------------------------------------
// 2. Programmatic Resume Matching Engine
// ----------------------------------------------------
// Formula: Skills = 50%, Experience = 30%, Education = 20%
export const calculateMatchScore = (parsedResume, jobDetails) => {
  try {
    let skillsScore = 0;
    let expScore = 0;
    let eduScore = 0;

    // 1. Skills Match (50%)
    if (jobDetails.skillsRequired && jobDetails.skillsRequired.length > 0) {
      const requiredSkills = jobDetails.skillsRequired.map(s => s.toLowerCase());
      const candidateSkills = (parsedResume.skills || []).map(s => s.toLowerCase());
      
      let matchCount = 0;
      requiredSkills.forEach(reqSkill => {
        if (candidateSkills.some(candSkill => candSkill.includes(reqSkill) || reqSkill.includes(candSkill))) {
          matchCount++;
        }
      });
      
      skillsScore = (matchCount / requiredSkills.length) * 100;
    } else {
      skillsScore = 100; // No skills required, default match
    }

    // 2. Experience Match (30%)
    // Parse experience numbers (e.g. "3 years" -> 3)
    const getYears = (str) => {
      if (!str) return 0;
      const match = str.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };

    const reqYears = getYears(jobDetails.experienceRequired);
    const candYears = getYears(parsedResume.experience);

    if (reqYears === 0) {
      expScore = 100;
    } else {
      expScore = candYears >= reqYears ? 100 : (candYears / reqYears) * 100;
    }

    // 3. Education Match (20%)
    // Check if degree indicators match
    const eduStr = (parsedResume.education || '').toLowerCase();
    const jdDesc = (jobDetails.description || '').toLowerCase();
    
    let eduMatch = false;
    const degrees = ['phd', 'mba', 'm.tech', 'b.tech', 'mca', 'master', 'bachelor', 'b.sc', 'm.sc', 'degree'];
    
    // Simple heuristic
    const matchedDegree = degrees.find(deg => eduStr.includes(deg));
    if (matchedDegree) {
      // If candidate has a Master's or PhD, give high score
      if (matchedDegree === 'phd' || matchedDegree === 'master' || matchedDegree === 'm.tech' || matchedDegree === 'mba') {
        eduScore = 100;
      } else {
        eduScore = 80; // Bachelor/B.Tech/MCA
      }
    } else {
      eduScore = 50; // default partial matching
    }

    // Calculate final weighted score
    const finalScore = (skillsScore * 0.5) + (expScore * 0.3) + (eduScore * 0.2);
    return Math.round(finalScore);
  } catch (error) {
    console.error('Error calculating match score:', error);
    return 50; // Fallback median
  }
};


// ----------------------------------------------------
// 3. Premium AI Interview Questions Generator
// ----------------------------------------------------
export const generateQuestionsForJob = async (jobTitle, jobDescription) => {
  if (hasApiKey && genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
        You are an expert technical interviewer. Generate a list of 5 relevant interview questions for a candidate applying to this job.
        
        Job Title: ${jobTitle}
        Job Description:
        ${jobDescription}
        
        Provide the output as a simple array of 5 strings in a JSON list (e.g. ["Question 1", "Question 2"]). Return only the JSON list.
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error('Gemini questions generation failed, using fallback:', e.message);
    }
  }

  // Fallback questions based on job title
  const title = (jobTitle || '').toLowerCase();
  if (title.includes('react') || title.includes('frontend') || title.includes('client')) {
    return [
      "Explain the Virtual DOM and how React's reconciliation process works.",
      "How do you optimize a React application that is experiencing slow rendering performance?",
      "What are the differences between standard state management (like useState) and global stores (like Redux Toolkit)?",
      "Describe React's Hook lifecycle and rules (e.g. useEffect cleanups).",
      "How do you handle micro-frontend responsive designs or Tailwind utilities in layout components?"
    ];
  }

  return [
    `What are the key design patterns and architectures you would use for a project like ${jobTitle || 'this'}?`,
    "Describe a challenging bug you encountered in production and how you went about debugging it.",
    "Explain how you design database schemas and handle migrations or scalability constraints.",
    "How do you approach writing clean, self-documenting code and unit tests?",
    "Describe your experience working with deployment pipelines and cloud configurations."
  ];
};


// ----------------------------------------------------
// 4. Premium AI Resume Suggestions Builder
// ----------------------------------------------------
export const suggestImprovements = async (parsedResume, jobDetails) => {
  if (hasApiKey && genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
        Compare this candidate's parsed resume details against the Job Description and return advice on how to improve the resume.
        Provide a JSON response containing three arrays:
        1. "missingSkills": List of 2-3 key technical skills mentioned in the JD but missing in the resume.
        2. "weakKeywords": List of 2-3 weak phrases or keywords that could be improved.
        3. "recommendations": List of 2-3 formatting or content changes to make it fit this job role.
        
        JSON schema:
        {
          "missingSkills": ["React Query", "Jest"],
          "weakKeywords": ["good communicator", "responsible for X"],
          "recommendations": ["Highlight TypeScript experience more prominently", "Add a metrics-driven achievement section"]
        }
        
        Candidate Resume:
        Skills: ${JSON.stringify(parsedResume.skills)}
        Experience: ${parsedResume.experience}
        Education: ${parsedResume.education}
        
        Job Title: ${jobDetails.title}
        Job Description:
        ${jobDetails.description}
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error('Gemini improvement suggestion failed, using fallback:', e.message);
    }
  }

  // Fallback suggestions
  const resumeSkills = (parsedResume.skills || []).map(s => s.toLowerCase());
  const jobSkills = (jobDetails.skillsRequired || []).map(s => s.toLowerCase());
  
  const missing = jobDetails.skillsRequired.filter(s => !resumeSkills.includes(s.toLowerCase())).slice(0, 3);
  
  return {
    missingSkills: missing.length > 0 ? missing : ["Unit Testing", "System Architecture", "CI/CD Pipelines"],
    weakKeywords: ["Responsible for writing code", "Assisted in project lifecycle", "Experienced developer"],
    recommendations: [
      `Incorporate more results-focused verbs and list specific accomplishments for your experience.`,
      `Add a dedicated section showcasing projects built with ${parsedResume.skills.slice(0, 3).join(', ') || 'modern frameworks'}.`,
      `Tailor your professional summary to explicitly match the required experience (${jobDetails.experienceRequired || 'requested in the job'}).`
    ]
  };
};

// ----------------------------------------------------
// 5. Premium AI Job Description Generator
// ----------------------------------------------------
export const generateJDText = async (jobTitle, experienceRequired, skillsRequired) => {
  if (hasApiKey && genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
        You are an expert HR recruiter. Generate a professional and compelling Job Description (JD) for the following job role.
        Use clean Markdown headers.

        Job Title: ${jobTitle}
        Experience Required: ${experienceRequired}
        Key Skills Required: ${Array.isArray(skillsRequired) ? skillsRequired.join(', ') : skillsRequired}

        The Job Description should contain:
        1. **Role Overview**: A high-impact paragraph describing the opportunity.
        2. **Key Responsibilities**: Bullet points (4-5 items) detailing what the developer will build and own.
        3. **Qualifications & Requirements**: Bullet points (4-5 items) detailing the required tech stack and experience.
        4. **Perks & Benefits**: Standard industry perks (e.g. Remote work, health benefits, learning stipends).
      `;

      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (e) {
      console.error('Gemini JD generation failed, using fallback:', e.message);
    }
  }

  // Fallback JD
  return `### Role Overview
We are looking for a skilled and passionate **${jobTitle}** to join our growing product team. In this role, you will be responsible for designing, developing, and deploying high-performance applications, collaborating closely with design and engineering teams.

### Key Responsibilities
- Architect, build, and maintain highly scalable web applications.
- Optimize frontend and backend performance for maximum speed and scale.
- Collaborate with product managers and UI designers to translate mockups into premium functional features.
- Write clean, testable, and maintainable code with thorough unit testing.
- Participate in code reviews and mentor junior engineering staff.

### Qualifications & Requirements
- Proven experience (around **${experienceRequired || '2+ years'}**) working in software product development.
- Strong proficiency in **${Array.isArray(skillsRequired) ? skillsRequired.join(', ') : skillsRequired || 'React, Node.js, and TypeScript'}**.
- Solid understanding of database design, state management, and modern development workflows.
- Excellent communication and collaborative system design skills.

### Perks & Benefits
- Competitive salary with performance bonuses.
- Comprehensive health, dental, and vision cover.
- 100% remote-first working culture with flexible hours.
- Yearly professional development and home-office stipends.`;
};

// ----------------------------------------------------
// 6. Premium AI Practice Interview Grading Engine
// ----------------------------------------------------
export const gradePracticeAnswers = async (jobTitle, questions, answers) => {
  if (hasApiKey && genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
        You are an expert interviewer grading a candidate's answers to technical practice questions for the role: ${jobTitle}.
        Analyze the questions and candidate's answers provided below, and return a grading report as a valid JSON object.
        Only return the JSON object, do not write any markdown code blocks or additional text.

        JSON Schema:
        {
          "overallScore": 85, // Integer from 0 to 100
          "overallFeedback": "Overall feedback text summarizing performance.",
          "gradings": [
            {
              "question": "The question text",
              "answer": "Candidate's answer",
              "score": 8, // 0 to 10 rating
              "feedback": "Specific feedback for this answer.",
              "modelAnswer": "Brief ideal model answer."
            }
          ]
        }

        Questions & Answers:
        ${JSON.stringify(questions.map((q, i) => ({ question: q, answer: answers[i] || "No answer provided" })))}
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error('Gemini practice grading failed, using fallback:', e.message);
    }
  }

  // Fallback grading logic
  const gradings = questions.map((q, i) => {
    const ans = answers[i] || "";
    const wordCount = ans.split(/\s+/).filter(Boolean).length;
    let score = 5;
    let feedback = "Your answer is quite brief. Try to elaborate on technical details and provide real-world examples.";
    if (wordCount > 35) {
      score = 8;
      feedback = "Good detail and technical explanations provided. Well done.";
    } else if (wordCount === 0) {
      score = 0;
      feedback = "No answer was submitted for this question.";
    }
    return {
      question: q,
      answer: ans || "No answer provided",
      score,
      feedback,
      modelAnswer: `Model answer for: "${q.substring(0, 30)}..." - Ideal answers should define core concepts, mention state patterns, outline performance implications, and provide a concrete snippet/example.`
    };
  });

  const totalScore = Math.round((gradings.reduce((sum, g) => sum + g.score, 0) / (questions.length * 10)) * 100);

  return {
    overallScore: totalScore,
    overallFeedback: "This is a simulated grading assessment. To get higher marks, provide detailed conceptual definitions and discuss scalability or trade-offs.",
    gradings
  };
};
