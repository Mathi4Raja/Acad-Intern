import { Router } from 'express';
import { signup, login, getMe, logout, forgotPassword, verifyResetToken, resetPassword, googleAuth, deleteAccount, verifyEmail, resendVerification } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/resend-verification', resendVerification);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.get('/verify-email', verifyEmail);
router.get('/reset-password/:token', verifyResetToken);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.delete('/account', protect, deleteAccount);

export default router;

