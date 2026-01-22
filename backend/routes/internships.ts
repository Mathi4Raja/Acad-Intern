import { Router } from 'express';
import {
    getInternships,
    getInternship,
    createInternship,
    updateInternship,
    deleteInternship,
    matchInternships,
    getMyInternships
} from '../controllers/internshipController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getInternships);
router.get('/match', protect, authorize('student'), matchInternships);
router.get('/company/my', protect, authorize('company'), getMyInternships); // New route
router.get('/:id', getInternship);

// Protected routes (Company only)
router.post('/', protect, authorize('company'), createInternship);
router.put('/:id', protect, authorize('company'), updateInternship);
router.delete('/:id', protect, authorize('company', 'admin'), deleteInternship);

export default router;
