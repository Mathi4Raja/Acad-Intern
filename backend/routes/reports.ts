import { Router } from 'express';
import { createReport, getReports, getReport } from '../controllers/reportController';
import { protect, authorize } from '../middleware/auth';
import upload from '../utils/fileUpload';

const router = Router();

router.post('/', protect, upload.array('screenshots', 3), createReport);
router.get('/', protect, authorize('admin'), getReports);
router.get('/:id', protect, authorize('admin'), getReport);

export default router;
