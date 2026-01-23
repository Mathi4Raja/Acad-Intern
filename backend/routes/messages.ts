import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth';
import {
    getConversations,
    getMessages,
    sendMessage,
    markAsSeen,
    getUnreadCount
} from '../controllers/messageController';

const router = express.Router();

// Configure multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB max
    }
});

// All routes require authentication
router.use(protect);

// Get all conversations
router.get('/conversations', getConversations);

// Get unread message count
router.get('/unread-count', getUnreadCount);

// Get messages for a specific application
router.get('/application/:applicationId', getMessages);

// Send a message (with optional file attachments)
router.post('/application/:applicationId', upload.array('files', 5), sendMessage);

// Mark messages as seen
router.patch('/application/:applicationId/seen', markAsSeen);

export default router;
