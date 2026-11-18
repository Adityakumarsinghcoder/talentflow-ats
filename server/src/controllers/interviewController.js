import Interview from '../models/Interview.js';
import Application from '../models/Application.js';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { sendInterviewScheduled } from '../services/emailService.js';
import { generateQuestionsForJob, gradePracticeAnswers } from '../services/geminiService.js';

// Helper: generate a mock Google Meet Link
const generateMockMeetLink = () => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const getChunk = (len) => Array.from({ length: len }, () => letters.charAt(Math.floor(Math.random() * letters.length))).join('');
  return `https://meet.google.com/${getChunk(3)}-${getChunk(4)}-${getChunk(3)}`;
};

// @desc    Schedule a new interview
// @route   POST /api/interviews
// @access  Private (COMPANY_ADMIN, RECRUITER)
export const scheduleInterview = async (req, res) => {
  try {
    const { applicationId, interviewerId, date, duration } = req.body;

    if (!applicationId || !interviewerId || !date) {
      return res.status(400).json({ message: 'Application ID, Interviewer ID, and Date are required' });
    }

    // 1. Verify Application & Job
    const application = await Application.findById(applicationId)
      .populate('jobId')
      .populate('candidateId', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application details not found' });
    }

    // Tenancy Check
    if (application.jobId.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ message: 'Access denied: company mismatch' });
    }

    // 2. Verify Interviewer exists in the same company
    const interviewer = await User.findById(interviewerId);
    if (!interviewer) {
      return res.status(404).json({ message: 'Assigned interviewer not found' });
    }
    if (interviewer.companyId?.toString() !== req.user.companyId.toString()) {
      return res.status(400).json({ message: 'Interviewer must belong to your company' });
    }

    // 3. Generate meeting link
    const meetingLink = generateMockMeetLink();

    // 4. Create interview record
    const interview = await Interview.create({
      applicationId,
      interviewerId,
      date,
      duration: duration || 45,
      meetingLink,
      status: 'SCHEDULED',
    });

    // 5. Automatically promote candidate application stage to 'INTERVIEW'
    application.currentStage = 'INTERVIEW';
    await application.save();

    // 6. Log Activity
    await ActivityLog.create({
      userId: req.user.id,
      action: 'SCHEDULE_INTERVIEW',
      targetType: 'Interview',
      targetId: interview._id,
    });

    // 7. Dispatch simulated/real email invite
    await sendInterviewScheduled(
      application.candidateId.email,
      application.candidateId.name,
      application.jobId.title,
      date,
      meetingLink
    );

    res.status(201).json(interview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error scheduling interview', error: error.message });
  }
};

// @desc    Get interviews list
// @route   GET /api/interviews
// @access  Private (Candidates, Recruiters, Interviewers)
export const getInterviews = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'INTERVIEWER') {
      // Interviewers see assigned meetings
      query.interviewerId = req.user.id;
    }

    // Load interviews with full populations
    const interviews = await Interview.find(query)
      .populate({
        path: 'applicationId',
        populate: [
          { path: 'candidateId', select: 'name email avatar' },
          { path: 'jobId' }
        ]
      })
      .populate('interviewerId', 'name email')
      .sort({ date: 1 });

    // Multi-tenant check
    if (req.user.role === 'RECRUITER' || req.user.role === 'COMPANY_ADMIN') {
      // Filter out interviews where job doesn't belong to the recruiter's company
      const companyInterviews = interviews.filter(inv => {
        if (!inv.applicationId || !inv.applicationId.jobId) return false;
        return inv.applicationId.jobId.companyId.toString() === req.user.companyId.toString();
      });
      return res.json(companyInterviews);
    }

    if (req.user.role === 'CANDIDATE') {
      // Candidates see their own interviews
      const candidateInterviews = interviews.filter(inv => {
        if (!inv.applicationId) return false;
        return inv.applicationId.candidateId._id.toString() === req.user.id.toString();
      });
      return res.json(candidateInterviews);
    }

    res.json(interviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving interviews list', error: error.message });
  }
};

// @desc    Submit interviewer feedback
// @route   POST /api/interviews/:id/feedback
// @access  Private (COMPANY_ADMIN, RECRUITER, INTERVIEWER)
export const submitFeedback = async (req, res) => {
  try {
    const { rubrics, technicalScore, communicationScore, cultureFitScore, comments, recommendation } = req.body;

    const interview = await Interview.findById(req.params.id)
      .populate({
        path: 'applicationId',
        populate: { path: 'jobId' }
      });

    if (!interview) {
      return res.status(404).json({ message: 'Interview slot not found' });
    }

    // Tenancy / Access Check: Check if user is the assigned interviewer or recruiter from same company
    if (req.user.role === 'INTERVIEWER' && interview.interviewerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied: you are not the assigned interviewer' });
    }
    if (
      (req.user.role === 'RECRUITER' || req.user.role === 'COMPANY_ADMIN') && 
      interview.applicationId.jobId.companyId.toString() !== req.user.companyId.toString()
    ) {
      return res.status(403).json({ message: 'Access denied: company mismatch' });
    }

    // Check if feedback already submitted
    const feedbackExists = await Feedback.findOne({ interviewId: interview._id });
    if (feedbackExists) {
      return res.status(400).json({ message: 'Feedback has already been submitted for this interview' });
    }

    let finalRubrics = [];
    let finalTech = 5;
    let finalComm = 5;
    let finalCult = 5;
    let weightedAverage = 5;

    if (rubrics && Array.isArray(rubrics) && rubrics.length > 0) {
      const totalWeight = rubrics.reduce((sum, r) => sum + parseFloat(r.weight || 0), 0);
      if (Math.abs(totalWeight - 100) > 0.1) {
        return res.status(400).json({ message: `Rubric weights must sum to 100% (currently ${totalWeight}%)` });
      }

      finalRubrics = rubrics.map(r => ({
        criterion: r.criterion,
        score: parseFloat(r.score),
        weight: parseFloat(r.weight),
      }));

      weightedAverage = finalRubrics.reduce((sum, r) => sum + r.score * (r.weight / 100), 0);
      weightedAverage = Math.round(weightedAverage * 10) / 10;

      const techRub = finalRubrics.find(r => /tech/i.test(r.criterion) || /coding/i.test(r.criterion));
      const commRub = finalRubrics.find(r => /comm/i.test(r.criterion));
      const cultRub = finalRubrics.find(r => /cult/i.test(r.criterion) || /fit/i.test(r.criterion));

      finalTech = techRub ? techRub.score : Math.round(weightedAverage);
      finalComm = commRub ? commRub.score : Math.round(weightedAverage);
      finalCult = cultRub ? cultRub.score : Math.round(weightedAverage);
    } else {
      if (!technicalScore || !communicationScore || !cultureFitScore) {
        return res.status(400).json({ message: 'Please provide rubrics scorecard or individual technical/communication/culture scores.' });
      }

      finalTech = parseInt(technicalScore);
      finalComm = parseInt(communicationScore);
      finalCult = parseInt(cultureFitScore);

      finalRubrics = [
        { criterion: 'Technical Skills', score: finalTech, weight: 40 },
        { criterion: 'Communication', score: finalComm, weight: 30 },
        { criterion: 'Culture Fit', score: finalCult, weight: 30 }
      ];

      weightedAverage = (finalTech * 0.4) + (finalComm * 0.3) + (finalCult * 0.3);
      weightedAverage = Math.round(weightedAverage * 10) / 10;
    }

    if (!recommendation) {
      return res.status(400).json({ message: 'Recommendation is required' });
    }

    // Create Feedback
    const feedback = await Feedback.create({
      interviewId: interview._id,
      technicalScore: finalTech,
      communicationScore: finalComm,
      cultureFitScore: finalCult,
      comments: comments || '',
      recommendation,
      rubrics: finalRubrics,
      weightedAverage,
    });

    // Mark Interview as COMPLETED
    interview.status = 'COMPLETED';
    await interview.save();

    // Log Activity
    await ActivityLog.create({
      userId: req.user.id,
      action: 'SUBMIT_FEEDBACK',
      targetType: 'Feedback',
      targetId: feedback._id,
    });

    res.status(201).json(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error saving feedback details', error: error.message });
  }
};

// @desc    Get feedback for an interview
// @route   GET /api/interviews/:id/feedback
// @access  Private (COMPANY_ADMIN, RECRUITER, INTERVIEWER)
export const getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ interviewId: req.params.id });
    if (!feedback) {
      return res.status(404).json({ message: 'No feedback submitted yet for this interview' });
    }
    res.json(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving feedback' });
  }
};

// @desc    Generate technical practice questions for a candidate
// @route   GET /api/interviews/practice/questions
// @access  Private (CANDIDATE)
export const generatePracticeQuestions = async (req, res) => {
  try {
    const { applicationId } = req.query;
    if (!applicationId) {
      return res.status(400).json({ message: 'Application ID is required' });
    }

    const application = await Application.findById(applicationId).populate('jobId');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.candidateId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied: not your application' });
    }

    const fullQuestionsList = await generateQuestionsForJob(application.jobId.title, application.jobId.description);
    const questions = fullQuestionsList.slice(0, 3); // Return first 3 questions

    res.json({ questions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating practice questions', error: error.message });
  }
};

// @desc    Grade technical practice answers submitted by a candidate
// @route   POST /api/interviews/practice/grade
// @access  Private (CANDIDATE)
export const gradeCandidatePractice = async (req, res) => {
  try {
    const { applicationId, questions, answers } = req.body;
    if (!applicationId || !questions || !answers) {
      return res.status(400).json({ message: 'Application ID, questions, and answers are required' });
    }

    const application = await Application.findById(applicationId).populate('jobId');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.candidateId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied: not your application' });
    }

    const report = await gradePracticeAnswers(application.jobId.title, questions, answers);
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error grading practice answers', error: error.message });
  }
};
