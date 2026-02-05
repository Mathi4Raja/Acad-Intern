import { Router } from 'express';
import { getMe, updateProfile, getStudentProfile } from '../controllers/studentController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/profile/me', protect, authorize('student'), getMe);
router.get('/profile/:id', protect, authorize('company', 'admin'), getStudentProfile);
router.post('/profile', protect, authorize('student'), updateProfile);

export default router;
