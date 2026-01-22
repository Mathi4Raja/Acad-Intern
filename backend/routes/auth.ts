import { Router } from 'express';
import { signup, login, getMe, logout } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;
