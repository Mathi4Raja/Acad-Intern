import { Router } from 'express';
import { protect } from '../middleware/auth';
import { registerMobileDevice, unregisterMobileDevice } from '../controllers/mobileController';

const router = Router();

router.post('/devices', protect, registerMobileDevice);
router.delete('/devices', protect, unregisterMobileDevice);

export default router;
