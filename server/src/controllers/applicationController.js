import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import Message from '../models/Message.js';
import { calculateMatchScore } from '../services/geminiService.js';
import { 
  sendApplicationReceived, 
  sendOfferLetter, 
  sendRejectionEmail 
} from '../services/emailService.js';

// @desc    Apply to a job
// @route   POST /api/applications
// @access  Private (CANDIDATE)
export const applyToJob = async (req, res) => {
  try {
    const { jobId, source, screeningAnswers } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    // 1. Verify Job exists and is OPEN
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (job.status !== 'OPEN') {
      return res.status(400).json({ message: 'This job posting is closed' });
    }

    // Validate screening answers if screening questions exist
    if (job.screeningQuestions && job.screeningQuestions.length > 0) {
      if (!screeningAnswers || !Array.isArray(screeningAnswers)) {
        return res.status(400).json({ message: 'Screening questions must be answered' });
      }

      const missingAnswer = job.screeningQuestions.some(q => {
        const found = screeningAnswers.find(sa => sa.question === q);
        return !found || !found.answer || found.answer.trim().length === 0;
      });

      if (missingAnswer) {
        return res.status(400).json({ message: 'All screening questions must be answered' });
      }
    }

    // 2. Check if candidate already applied
    const alreadyApplied = await Application.findOne({
      candidateId: req.user.id,
      jobId,
    });
    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    // 3. Fetch candidate's resume
    const resume = await Resume.findOne({ candidateId: req.user.id });
    if (!resume) {
      return res.status(400).json({ 
        message: 'No resume found. Please upload a resume on your profile before applying.',
        code: 'RESUME_REQUIRED'
      });
    }

    // 4. Calculate AI Match Score (Skills 50%, Experience 30%, Education 20%)
    const aiScore = calculateMatchScore(resume.parsedData, job);

    // 5. Create application
    const application = await Application.create({
      candidateId: req.user.id,
      jobId,
      source: source || 'CAREER_PORTAL',
      aiScore,
      currentStage: 'APPLIED',
      screeningAnswers: screeningAnswers || [],
    });

    // 6. Log Activity
    await ActivityLog.create({
      userId: req.user.id,
      action: 'APPLY_TO_JOB',
      targetType: 'Application',
      targetId: application._id,
    });

    // Send email notification (real or simulated log fallback)
    await sendApplicationReceived(req.user.email, req.user.name, job.title);

    res.status(201).json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing application', error: error.message });
  }
};

// @desc    Get applications
// @route   GET /api/applications
// @access  Private (CANDIDATE, RECRUITER, COMPANY_ADMIN)
export const getApplications = async (req, res) => {
  try {
    const { jobId } = req.query;

    if (req.user.role === 'CANDIDATE') {
      // Candidates see their own applications
      const applications = await Application.find({ candidateId: req.user.id })
        .populate('jobId')
        .sort({ appliedDate: -1 });
      
      // Filter out populated jobs that might have been deleted (Mongoose populate returns null)
      const validApplications = applications.filter(app => app.jobId !== null);
      return res.json(validApplications);
    }

    // Recruiters/Admins see applications for their company's jobs
    let query = {};
    
    if (jobId) {
      query.jobId = jobId;
    }

    // Load applications
    const allApps = await Application.find(query)
      .populate('candidateId', 'name email avatar')
      .populate('jobId')
      .sort({ aiScore: -1, appliedDate: -1 });

    // Multi-tenant check: filter to only show applications where job belongs to recruiter's company
    const myCompanyApps = allApps.filter(app => {
      if (!app.jobId) return false;
      return app.jobId.companyId.toString() === req.user.companyId.toString();
    });

    res.json(myCompanyApps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving applications', error: error.message });
  }
};

// @desc    Update application stage (Kanban board DND)
// @route   PUT /api/applications/:id/stage
// @access  Private (COMPANY_ADMIN, RECRUITER)
export const updateApplicationStage = async (req, res) => {
  try {
    const { stage } = req.body;
    const allowedStages = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED'];

    if (!stage || !allowedStages.includes(stage)) {
      return res.status(400).json({ message: 'Invalid or missing pipeline stage' });
    }

    const application = await Application.findById(req.params.id)
      .populate('jobId');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Tenancy Check
    if (application.jobId.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ message: 'Access denied: cannot edit another company’s applications' });
    }

    application.currentStage = stage;
    await application.save();

    // Log Activity
    await ActivityLog.create({
      userId: req.user.id,
      action: `MOVE_STAGE_${stage}`,
      targetType: 'Application',
      targetId: application._id,
    });

    // Send status update emails
    try {
      const candidate = await User.findById(application.candidateId);
      if (candidate) {
        if (stage === 'OFFERED') {
          await sendOfferLetter(candidate.email, candidate.name, application.jobId.title, 'TalentFlow Company');
        } else if (stage === 'REJECTED') {
          await sendRejectionEmail(candidate.email, candidate.name, application.jobId.title);
        }
      }
    } catch (emailErr) {
      console.error('Error sending stage update email:', emailErr.message);
    }

    // Send automated chat messages from Recruiter side on clearing any round
    try {
      const candidate = await User.findById(application.candidateId);
      if (candidate) {
        let chatMessageText = '';
        const candidateName = candidate.name || 'Candidate';
        const jobTitle = application.jobId.title || 'the position';

        switch (stage) {
          case 'SCREENING':
            chatMessageText = `Hi ${candidateName}, congratulations! Your profile has cleared our initial application review. We have moved your status to the Screening round. I will follow up shortly to arrange next steps.`;
            break;
          case 'SHORTLISTED':
            chatMessageText = `Hello ${candidateName}, excellent news! The hiring team has reviewed your screening details and shortlisted your application for the next evaluation phase. We will coordinate details with you soon.`;
            break;
          case 'INTERVIEW':
            chatMessageText = `Hi ${candidateName}, we are excited to invite you for a formal interview round for the ${jobTitle} position! Please check your Interviews portal to coordinate scheduling.`;
            break;
          case 'OFFERED':
            chatMessageText = `Dear ${candidateName}, congratulations! We are absolutely thrilled to extend you a formal job offer for the ${jobTitle} position! We have sent the details to your email. Please review and let us know your decision.`;
            break;
          case 'HIRED':
            chatMessageText = `Congratulations ${candidateName}! Welcome aboard to the team! We are extremely excited to have you join us. Our onboarding team will get in touch with you shortly.`;
            break;
          case 'REJECTED':
            chatMessageText = `Hi ${candidateName}, thank you for your time and interest in the ${jobTitle} role. Unfortunately, we have decided to move forward with other candidates at this time. We wish you the best in your career pursuits.`;
            break;
        }

        if (chatMessageText) {
          await Message.create({
            senderId: req.user.id,
            receiverId: application.candidateId,
            text: chatMessageText
          });
        }
      }
    } catch (msgErr) {
      console.error('Error creating automated stage change chat message:', msgErr.message);
    }

    res.json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating application stage', error: error.message });
  }
};
