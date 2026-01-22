import { Router } from 'express';
import { getMe, updateProfile } from '../controllers/studentController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/profile/me', protect, authorize('student'), getMe);
router.post('/profile', protect, authorize('student'), updateProfile);

export default router;
