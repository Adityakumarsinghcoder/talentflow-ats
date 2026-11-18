import express from 'express';
import {
  scheduleInterview,
  getInterviews,
  submitFeedback,
  getFeedback,
  generatePracticeQuestions,
  gradeCandidatePractice,
} from '../controllers/interviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import { canViewInterviews } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.post('/', protect, scheduleInterview);
router.get('/', protect, getInterviews);
router.get('/practice/questions', protect, generatePracticeQuestions);
router.post('/practice/grade', protect, gradeCandidatePractice);
router.post('/:id/feedback', protect, submitFeedback);
router.get('/:id/feedback', protect, getFeedback);

export default router;
