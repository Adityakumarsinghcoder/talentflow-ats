import express from 'express';
import {
  applyToJob,
  getApplications,
  updateApplicationStage,
} from '../controllers/applicationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { canManageCandidates } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.post('/', protect, applyToJob);
router.get('/', protect, getApplications);
router.put('/:id/stage', protect, canManageCandidates, updateApplicationStage);

export default router;
