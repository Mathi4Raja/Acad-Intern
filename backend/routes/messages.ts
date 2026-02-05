import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth';
import {
    getConversations,
    getMessages,
    sendMessage,
    markAsSeen,
    getUnreadCount,
    muteConversation,
    getPreferences
} from '../controllers/messageController';

const router = express.Router();

// Configure multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max (Safety cap, admin setting is source of truth)
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

// Mute/Unmute conversation
router.post('/application/:applicationId/mute', muteConversation);

// Get conversation preferences
router.get('/application/:applicationId/preferences', getPreferences);

export default router;
