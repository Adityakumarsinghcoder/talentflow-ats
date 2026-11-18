import express from 'express';
import {
  uploadAndParseResume,
  getMyResume,
  getResumeSuggestions,
  updateMyResume,
} from '../controllers/resumeController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/upload', protect, upload.single('resume'), uploadAndParseResume);
router.get('/my-resume', protect, getMyResume);
router.put('/my-resume', protect, updateMyResume);
router.get('/suggestions/:jobId', protect, getResumeSuggestions);

export default router;
