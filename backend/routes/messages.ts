import { Router } from 'express';
import {
    getConversations,
    getOrCreateConversation,
    getMessages,
    sendMessage,
    startConversationWithCompany,
    uploadMessageFile
} from '../controllers/messageController';
import { protect } from '../middleware/auth';
import multer from 'multer';

const router = Router();

// Configure multer for memory storage (for R2 upload)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});

// All routes require authentication
router.use(protect);

// File upload route
router.post('/upload', upload.single('file'), uploadMessageFile);

// Conversation routes
router.get('/conversations', getConversations);
router.post('/conversations', getOrCreateConversation);
router.get('/conversations/:conversationId', getMessages);
router.post('/conversations/:conversationId', sendMessage);

// Helper route to start conversation with company
router.post('/start-with-company/:companyUserId', startConversationWithCompany);

export default router;
