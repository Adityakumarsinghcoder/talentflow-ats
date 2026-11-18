import express from 'express';
import { sendMessage, getMessages, getChatPartners } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/partners', protect, getChatPartners);
router.post('/', protect, sendMessage);
router.get('/:userId', protect, getMessages);

export default router;
