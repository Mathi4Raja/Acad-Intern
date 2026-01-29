import { Router } from 'express';
import { signup, login, getMe, logout, forgotPassword, verifyResetToken, resetPassword } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', verifyResetToken);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;
