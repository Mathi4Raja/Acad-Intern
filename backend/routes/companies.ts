import { Router } from 'express';
import { getMe, updateProfile, verifyCin, getProfileById } from '../controllers/companyController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/me', protect, authorize('company'), getMe);
router.get('/:id', protect, getProfileById);
router.post('/', protect, authorize('company'), updateProfile);
router.post('/verify-cin', protect, authorize('company'), verifyCin);

export default router;
