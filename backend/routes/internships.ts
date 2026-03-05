import { Router } from 'express';
import {
    getInternships,
    getInternship,
    createInternship,
    updateInternship,
    deleteInternship,
    matchInternships,
    getMyInternships,
    getPopularInternships,
    incrementViews
} from '../controllers/internshipController';
import { protect, authorize, optionalAuth } from '../middleware/auth';

const router = Router();

// Public routes (with optional auth for checking application status)
router.get('/', optionalAuth, getInternships);
router.get('/popular', optionalAuth, getPopularInternships);
router.get('/match', protect, authorize('student'), matchInternships);
router.get('/company/my', protect, authorize('company'), getMyInternships); // New route
router.get('/:id', optionalAuth, getInternship);
router.patch('/:id/views', optionalAuth, incrementViews);

// Protected routes (Company only)
router.post('/', protect, authorize('company'), createInternship);
router.put('/:id', protect, authorize('company'), updateInternship);
router.delete('/:id', protect, authorize('company', 'admin'), deleteInternship);

export default router;
