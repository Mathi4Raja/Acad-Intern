
import { Router } from 'express';
import { getPublicSettings } from '../controllers/settingsController';

const router = Router();

// Public settings route
router.get('/public', getPublicSettings);

export default router;
