import express from 'express';
import { getRecruiterAnalytics, getActivityLogs } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { canViewAnalytics } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.get('/', protect, canViewAnalytics, getRecruiterAnalytics);
router.get('/activity-logs', protect, canViewAnalytics, getActivityLogs);

export default router;
