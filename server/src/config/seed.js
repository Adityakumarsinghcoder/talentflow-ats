import User from '../models/User.js';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import Application from '../models/Application.js';
import Interview from '../models/Interview.js';
import Feedback from '../models/Feedback.js';
import ActivityLog from '../models/ActivityLog.js';
import Message from '../models/Message.js';

export const seedRealDB = async () => {
  try {
    console.log('[SEEDER] Clearing existing collections in the real database...');
    
    // Clear all collections to ensure a fresh, clean, and consistent seeding
    await User.deleteMany({});
    await Company.deleteMany({});
    await Job.deleteMany({});
    await Resume.deleteMany({});
    await Application.deleteMany({});
    await Interview.deleteMany({});
    await Feedback.deleteMany({});
    await ActivityLog.deleteMany({});
    await Message.deleteMany({});
    
    console.log('[SEEDER] Database cleared. Starting rich seeding...');

    // ==========================================
    // 1. Seed Companies
    // ==========================================
    const companyA = await Company.create({
      companyName: "TalentFlow Corp",
      industry: "SaaS & Software",
      website: "https://talentflow.co",
      recruitersCount: 2,
    });

    const companyB = await Company.create({
      companyName: "InnoTech Solutions",
      industry: "Software Development",
      website: "https://innotech.io",
      recruitersCount: 1,
    });

    console.log('[SEEDER] Seeded companies.');

    // ==========================================
    // 2. Seed Recruiters & Admins
    // ==========================================
    const seedPassword = "password123";

    // TalentFlow Recruiter Admin
    const recruiterSarah = await User.create({
      name: "Sarah Recruiter",
      email: "recruiter@talentflow.com",
      password: seedPassword,
      role: "COMPANY_ADMIN",
      companyId: companyA._id,
    });

    // TalentFlow Junior Recruiter
    const recruiterMark = await User.create({
      name: "Mark Recruiter",
      email: "mark@talentflow.com",
      password: seedPassword,
      role: "RECRUITER",
      companyId: companyA._id,
    });

    // InnoTech Recruiter Admin
    const recruiterJane = await User.create({
      name: "Jane Admin",
      email: "admin@innotech.com",
      password: seedPassword,
      role: "COMPANY_ADMIN",
      companyId: companyB._id,
    });

    console.log('[SEEDER] Seeded recruiters.');

    // ==========================================
    // 3. Seed Candidates
    // ==========================================
    // Candidate 1: Alex Developer (Applied, Interview, etc. stages)
    const candidateAlex = await User.create({
      name: "Alex Developer",
      email: "candidate@talentflow.com",
      password: seedPassword,
      role: "CANDIDATE",
    });

    // Candidate 2: John Smith (Shortlisted stage)
    const candidateJohn = await User.create({
      name: "John Smith",
      email: "john.smith@gmail.com",
      password: seedPassword,
      role: "CANDIDATE",
    });

    // Candidate 3: Emily Davis (Offered stage)
    const candidateEmily = await User.create({
      name: "Emily Davis",
      email: "emily.davis@gmail.com",
      password: seedPassword,
      role: "CANDIDATE",
    });

    // Candidate 4: Sophia Martinez (Hired stage)
    const candidateSophia = await User.create({
      name: "Sophia Martinez",
      email: "sophia.m@gmail.com",
      password: seedPassword,
      role: "CANDIDATE",
    });

    // Candidate 5: David Wilson (Rejected stage)
    const candidateDavid = await User.create({
      name: "David Wilson",
      email: "david.wilson@gmail.com",
      password: seedPassword,
      role: "CANDIDATE",
    });

    console.log('[SEEDER] Seeded candidates.');

    // ==========================================
    // 4. Seed Resumes
    // ==========================================
    await Resume.create({
      candidateId: candidateAlex._id,
      fileUrl: "/uploads/demo_resume.pdf",
      parsedData: {
        name: "Alex Developer",
        email: "candidate@talentflow.com",
        phone: "+1 555-0199",
        skills: ["React", "Redux", "Tailwind CSS", "TypeScript", "Node.js", "Javascript", "Express", "MongoDB"],
        experience: "4 years",
        education: "Bachelor in Computer Science (MIT)"
      },
    });

    await Resume.create({
      candidateId: candidateJohn._id,
      fileUrl: "/uploads/john_resume.pdf",
      parsedData: {
        name: "John Smith",
        email: "john.smith@gmail.com",
        phone: "+1 555-0211",
        skills: ["React", "CSS", "Javascript", "HTML5", "Vite", "Webpack"],
        experience: "2 years",
        education: "B.Sc. in Computer Systems"
      },
    });

    await Resume.create({
      candidateId: candidateEmily._id,
      fileUrl: "/uploads/emily_resume.pdf",
      parsedData: {
        name: "Emily Davis",
        email: "emily.davis@gmail.com",
        phone: "+1 555-0322",
        skills: ["React", "TypeScript", "Node.js", "AWS", "Docker", "GraphQL"],
        experience: "5 years",
        education: "M.S. in Software Engineering"
      },
    });

    await Resume.create({
      candidateId: candidateSophia._id,
      fileUrl: "/uploads/sophia_resume.pdf",
      parsedData: {
        name: "Sophia Martinez",
        email: "sophia.m@gmail.com",
        phone: "+1 555-0433",
        skills: ["React", "Node.js", "Next.js", "Tailwind CSS", "PostgreSQL", "Prisma"],
        experience: "3 years",
        education: "B.Tech in Computer Science"
      },
    });

    await Resume.create({
      candidateId: candidateDavid._id,
      fileUrl: "/uploads/david_resume.pdf",
      parsedData: {
        name: "David Wilson",
        email: "david.wilson@gmail.com",
        phone: "+1 555-0544",
        skills: ["Java", "Spring Boot", "SQL", "Docker"],
        experience: "1 year",
        education: "Associate Degree in Coding"
      },
    });

    console.log('[SEEDER] Seeded resumes.');

    // ==========================================
    // 5. Seed Jobs
    // ==========================================
    // Job 1: Senior React Engineer (TalentFlow)
    const jobReact = await Job.create({
      title: "Senior React Engineer",
      description: "Looking for a Senior React developer to lead the frontend development of our flagship product. You will work with React, Redux, and modern testing libraries.",
      skillsRequired: ["React", "Redux", "Tailwind CSS", "TypeScript"],
      salaryRange: "$120k - $145k",
      experienceRequired: "3 years",
      location: "Remote",
      employmentType: "FULL_TIME",
      companyId: companyA._id,
      recruiterId: recruiterSarah._id,
      status: "OPEN",
      openings: 3,
    });

    // Job 2: Senior DevOps Architect (TalentFlow)
    const jobDevOps = await Job.create({
      title: "Senior DevOps Architect",
      description: "Manage AWS infrastructure, set up Kubernetes clusters, and optimize CI/CD deployment pipelines using Terraform.",
      skillsRequired: ["Kubernetes", "AWS", "Terraform", "Ansible"],
      salaryRange: "$140k - $170k",
      experienceRequired: "5 years",
      location: "Remote",
      employmentType: "FULL_TIME",
      companyId: companyA._id,
      recruiterId: recruiterMark._id,
      status: "OPEN",
      openings: 1,
      screeningQuestions: [
        "What is your experience running multi-region Kubernetes clusters?",
        "Have you managed large scale infrastructure using Terraform?"
      ]
    });

    // Job 3: Product Manager (InnoTech)
    const jobPM = await Job.create({
      title: "Technical Product Manager",
      description: "Translate technology needs into structured product roadmaps, coordinating with engineering and design.",
      skillsRequired: ["Agile", "Jira", "SQL", "Product Roadmap"],
      salaryRange: "$110k - $130k",
      experienceRequired: "4 years",
      location: "Hybrid (New York)",
      employmentType: "FULL_TIME",
      companyId: companyB._id,
      recruiterId: recruiterJane._id,
      status: "OPEN",
      openings: 1,
    });

    // Job 4: QA Engineer (TalentFlow - Closed)
    const jobQA = await Job.create({
      title: "QA Engineer",
      description: "Conduct automated end-to-end browser testing and unit test analysis.",
      skillsRequired: ["Jest", "Playwright", "Selenium"],
      salaryRange: "$80k - $95k",
      experienceRequired: "2 years",
      location: "Remote",
      employmentType: "FULL_TIME",
      companyId: companyA._id,
      recruiterId: recruiterSarah._id,
      status: "CLOSED",
      openings: 1,
    });

    console.log('[SEEDER] Seeded jobs.');

    // ==========================================
    // 6. Seed Applications
    // ==========================================
    // App 1: Alex -> Senior React Engineer (INTERVIEW Stage)
    const appAlexReact = await Application.create({
      candidateId: candidateAlex._id,
      jobId: jobReact._id,
      source: "LINKEDIN",
      aiScore: 96,
      currentStage: "INTERVIEW",
    });

    // App 2: Alex -> Senior DevOps Architect (SCREENING Stage)
    const appAlexDevOps = await Application.create({
      candidateId: candidateAlex._id,
      jobId: jobDevOps._id,
      source: "CAREER_PORTAL",
      aiScore: 34,
      currentStage: "SCREENING",
      screeningAnswers: [
        { question: "What is your experience running multi-region Kubernetes clusters?", answer: "Configured multi-zone production EKS nodes on AWS." },
        { question: "Have you managed large scale infrastructure using Terraform?", answer: "Yes, structured module blueprints for multi-tenant envs." }
      ]
    });

    // App 3: John -> Senior React Engineer (SHORTLISTED Stage)
    const appJohnReact = await Application.create({
      candidateId: candidateJohn._id,
      jobId: jobReact._id,
      source: "REFERRAL",
      aiScore: 78,
      currentStage: "SHORTLISTED",
    });

    // App 4: Emily -> Senior React Engineer (OFFERED Stage)
    const appEmilyReact = await Application.create({
      candidateId: candidateEmily._id,
      jobId: jobReact._id,
      source: "LINKEDIN",
      aiScore: 92,
      currentStage: "OFFERED",
    });

    // App 5: Sophia -> Senior React Engineer (HIRED Stage)
    const appSophiaReact = await Application.create({
      candidateId: candidateSophia._id,
      jobId: jobReact._id,
      source: "CAREER_PORTAL",
      aiScore: 88,
      currentStage: "HIRED",
    });

    // App 6: David -> Senior React Engineer (REJECTED Stage)
    const appDavidReact = await Application.create({
      candidateId: candidateDavid._id,
      jobId: jobReact._id,
      source: "LINKEDIN",
      aiScore: 40,
      currentStage: "REJECTED",
    });

    console.log('[SEEDER] Seeded applications.');

    // ==========================================
    // 7. Seed Interviews & Feedbacks
    // ==========================================
    // Interview 1: Scheduled interview for Alex Developer (React Role)
    const interviewAlexReact = await Interview.create({
      applicationId: appAlexReact._id,
      interviewerId: recruiterSarah._id,
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      duration: 45,
      meetingLink: "https://meet.google.com/abc-defg-hij",
      status: "SCHEDULED",
    });

    // Interview 2: Completed interview for Sophia Martinez (Hired Role)
    const interviewSophiaReact = await Interview.create({
      applicationId: appSophiaReact._id,
      interviewerId: recruiterSarah._id,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      duration: 60,
      meetingLink: "https://meet.google.com/xyz-pdqr-lmn",
      status: "COMPLETED",
    });

    // Feedback for Sophia's Completed Interview
    const feedbackSophia = await Feedback.create({
      interviewId: interviewSophiaReact._id,
      technicalScore: 9,
      communicationScore: 8,
      cultureFitScore: 9,
      comments: "Exceptional frontend skill set. Very strong familiarity with build systems and server rendering (NextJS). Easy recommendation to hire.",
      recommendation: "HIRE",
      rubrics: [
        { criterion: "Technical Competence", score: 9, weight: 40 },
        { criterion: "System Design & Architecture", score: 8, weight: 30 },
        { criterion: "Communication & Collaboration", score: 9, weight: 30 }
      ],
      weightedAverage: 8.7,
    });

    console.log('[SEEDER] Seeded interviews & feedback.');

    // ==========================================
    // 8. Seed Direct Messages
    // ==========================================
    // Message thread between Recruiter Sarah & Candidate Alex
    await Message.create({
      senderId: recruiterSarah._id,
      receiverId: candidateAlex._id,
      text: "Hi Alex! Thanks for applying to the Senior React Engineer role. I reviewed your profile and matches look outstanding. We have moved you to the interview phase.",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    });

    await Message.create({
      senderId: candidateAlex._id,
      receiverId: recruiterSarah._id,
      text: "Hi Sarah! Thank you for the update. I'm very excited about the opportunity and looking forward to our call.",
      createdAt: new Date(Date.now() - 1.9 * 60 * 60 * 1000).toISOString(),
    });

    await Message.create({
      senderId: recruiterSarah._id,
      receiverId: candidateAlex._id,
      text: "Excellent. I have scheduled a Google Meet slot for tomorrow. You should receive the invitation email shortly.",
      createdAt: new Date(Date.now() - 1.8 * 60 * 60 * 1000).toISOString(),
    });

    console.log('[SEEDER] Seeded chat messages.');

    // ==========================================
    // 9. Seed Activity Logs
    // ==========================================
    await ActivityLog.create({
      userId: recruiterSarah._id,
      action: "CREATE_JOB",
      targetType: "Job",
      targetId: jobReact._id,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    });

    await ActivityLog.create({
      userId: recruiterMark._id,
      action: "CREATE_JOB",
      targetType: "Job",
      targetId: jobDevOps._id,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    });

    await ActivityLog.create({
      userId: recruiterSarah._id,
      action: "SCHEDULE_INTERVIEW",
      targetType: "Interview",
      targetId: interviewAlexReact._id,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    });

    await ActivityLog.create({
      userId: recruiterSarah._id,
      action: "SUBMIT_FEEDBACK",
      targetType: "Feedback",
      targetId: feedbackSophia._id,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    });

    console.log('[SEEDER] Seeded activity logs.');
    console.log('[SEEDER] Rich MongoDB database seeding completed successfully!');
  } catch (err) {
    console.error('[SEEDER] Error seeding rich data inside real database:', err.message, err.stack);
  }
};
