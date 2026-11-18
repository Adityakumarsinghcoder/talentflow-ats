import express from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getJobQuestions,
  generateJD,
} from '../controllers/jobController.js';
import { protect } from '../middleware/authMiddleware.js';
import { canCreateJob, canDeleteJob } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.get('/', getJobs);
router.post('/generate-jd', protect, canCreateJob, generateJD);
router.get('/:id', getJobById);
router.get('/:id/questions', protect, canCreateJob, getJobQuestions);
router.post('/', protect, canCreateJob, createJob);
router.put('/:id', protect, canCreateJob, updateJob);
router.delete('/:id', protect, canDeleteJob, deleteJob);

export default router;
