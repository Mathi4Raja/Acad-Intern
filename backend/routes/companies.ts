import { Router } from 'express';
import { getMe, updateProfile, verifyCin, submitManualVerification, getCompanies, getProfileById } from '../controllers/companyController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Need to be logged in as company to access these
router.get('/me', protect, authorize('company'), getMe);
router.post('/', protect, authorize('company'), updateProfile);
router.post('/verify-cin', protect, authorize('company'), verifyCin);
router.post('/verify-manual', protect, authorize('company'), submitManualVerification);

// Public routes (though still protected by auth)
router.get('/', protect, getCompanies);
router.get('/:id', protect, getProfileById);

export default router;
