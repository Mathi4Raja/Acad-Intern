import { Router } from 'express';
import { getStudentAnalytics } from '../controllers/analyticsController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/student', protect, authorize('student'), getStudentAnalytics);

export default router;
