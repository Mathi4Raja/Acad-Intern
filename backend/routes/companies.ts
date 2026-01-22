import { Router } from 'express';
import { getMe, updateProfile } from '../controllers/companyController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/me', protect, authorize('company'), getMe);
router.post('/', protect, authorize('company'), updateProfile);

export default router;
