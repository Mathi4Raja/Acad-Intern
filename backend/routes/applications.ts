import { Router } from 'express';
import {
    applyForInternship,
    getMyApplications,
    getInternshipApplications,
    updateApplicationStatus
} from '../controllers/applicationController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Student routes
router.post('/internships/:id/apply', protect, authorize('student'), applyForInternship);
router.get('/my', protect, authorize('student'), getMyApplications);

// Company routes
router.get('/internship/:id', protect, authorize('company'), getInternshipApplications);
router.patch('/:id/status', protect, authorize('company'), updateApplicationStatus);

export default router;
