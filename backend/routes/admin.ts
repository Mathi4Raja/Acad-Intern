import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import {
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    deleteUser,
    getAllCompanies,
    updateCompany,
    deleteCompany,
    getAllInternships,
    updateInternshipStatus,
    deleteInternship,
    getAllReports,
    updateReportStatus,
    getSystemSettings,
    updateSystemSettings,
    getAnalyticsStats,
    toggleShadowBan,
    suspendUser
} from '../controllers/adminController';
import { getReport as getReportDetails } from '../controllers/reportController';

const router = Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalyticsStats);

// Users management
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.post('/users/:id/shadow-ban', toggleShadowBan);
router.post('/users/:id/suspend', suspendUser);
router.delete('/users/:id', deleteUser);

// Companies management
router.get('/companies', getAllCompanies);
router.put('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);

// Internships management
router.get('/internships', getAllInternships);
router.put('/internships/:id', updateInternshipStatus);
router.delete('/internships/:id', deleteInternship);

// Reports management
router.get('/reports', getAllReports);
router.get('/reports/:id', getReportDetails);
router.put('/reports/:id', updateReportStatus);

// System Settings
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

export default router;
