import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import {
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    deleteUser,
    getAllCompanies,
    updateCompany,
    getAllInternships,
    updateInternshipStatus,
    deleteInternship,
    getAllReports,
    updateReportStatus
} from '../controllers/adminController';

const router = Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/stats', getDashboardStats);

// Users management
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Companies management
router.get('/companies', getAllCompanies);
router.put('/companies/:id', updateCompany);

// Internships management
router.get('/internships', getAllInternships);
router.put('/internships/:id', updateInternshipStatus);
router.delete('/internships/:id', deleteInternship);

// Reports management
router.get('/reports', getAllReports);
router.put('/reports/:id', updateReportStatus);

export default router;
