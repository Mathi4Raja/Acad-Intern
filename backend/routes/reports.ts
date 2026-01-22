import { Router } from 'express';
import { createReport, getReports } from '../controllers/reportController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.post('/', protect, createReport);
router.get('/', protect, authorize('admin'), getReports);

export default router;
