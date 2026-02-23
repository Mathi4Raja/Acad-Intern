import { request, app, createTestUser, createTestAdmin, createTestCompanyWithProfile, createTestStudentWithProfile } from './helpers';
import User from '../models/User';
import Internship from '../models/Internship';
import Company from '../models/Company';
import Report from '../models/Report';
import SystemSetting from '../models/SystemSetting';

// Helper constant for valid descriptions
const DESC = 'This is a valid test description that meets the minimum length requirement';

describe('Admin API', () => {
    describe('Authentication', () => {
        it('should reject non-admin users', async () => {
            const student = await createTestUser('student', 'adminreject');

            const res = await request(app)
                .get('/api/admin/stats')
                .set('Cookie', student.cookie);

            expect(res.status).toBe(403);
        });

        it('should reject unauthenticated requests', async () => {
            const res = await request(app)
                .get('/api/admin/stats');

            expect(res.status).toBe(401);
        });

        it('should allow admin access', async () => {
            const admin = await createTestAdmin('access');

            const res = await request(app)
                .get('/api/admin/stats')
                .set('Cookie', admin.cookie);

            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/admin/stats', () => {
        it('should return dashboard statistics', async () => {
            const admin = await createTestAdmin('stats');

            const res = await request(app)
                .get('/api/admin/stats')
                .set('Cookie', admin.cookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
        });
    });

    describe('GET /api/admin/analytics', () => {
        it('should return analytics data', async () => {
            const admin = await createTestAdmin('analytics');

            const res = await request(app)
                .get('/api/admin/analytics')
                .set('Cookie', admin.cookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('GET /api/admin/users', () => {
        it('should list all users', async () => {
            const admin = await createTestAdmin('listusers');
            await createTestUser('student', 'listtest');

            const res = await request(app)
                .get('/api/admin/users')
                .set('Cookie', admin.cookie);

            expect(res.status).toBe(200);
            expect(res.body.data).toBeDefined();
        });

        it('should filter by role', async () => {
            const admin = await createTestAdmin('filterrole');
            await createTestStudentWithProfile('filtertest');

            const res = await request(app)
                .get('/api/admin/users')
                .query({ role: 'student' })
                .set('Cookie', admin.cookie);

            expect(res.status).toBe(200);
            expect(res.body.data.every((u: any) => u.role === 'student')).toBe(true);
        });

        it('should filter by status', async () => {
            const admin = await createTestAdmin('filterstatus');

            const res = await request(app)
                .get('/api/admin/users')
                .query({ status: 'active' })
                .set('Cookie', admin.cookie);

            expect(res.status).toBe(200);
        });
    });

    describe('PUT /api/admin/users/:id/status', () => {
        it('should update user status', async () => {
            const admin = await createTestAdmin('updatestatus');
            const user = await createTestUser('student', 'statuschange');

            const res = await request(app)
                .put(`/api/admin/users/${user.id}/status`)
                .set('Cookie', admin.cookie)
                .send({ status: 'suspended' });

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('suspended');
        });

        it('should validate status enum', async () => {
            const admin = await createTestAdmin('invalidstatus');
            const user = await createTestUser('student', 'invalidstatus');

            const res = await request(app)
                .put(`/api/admin/users/${user.id}/status`)
                .set('Cookie', admin.cookie)
                .send({ status: 'invalid_status' });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/admin/users/:id/shadow-ban', () => {
        it('should update user shadow ban state', async () => {
            const admin = await createTestAdmin('shadowadmin');
            const user = await createTestUser('student', 'shadowstudent');

            // Initially false
            expect(user.id).toBeDefined();
            const initialUser = await User.findById(user.id);
            expect(initialUser?.isShadowBanned).toBe(false);

            // Enable shadow ban
            const res1 = await request(app)
                .post(`/api/admin/users/${user.id}/shadow-ban`)
                .set('Cookie', admin.cookie)
                .send({ shadowBanned: true });

            expect(res1.status).toBe(200);
            expect(res1.body.success).toBe(true);
            expect(res1.body.data.isShadowBanned).toBe(true);

            // Disable shadow ban
            const res2 = await request(app)
                .post(`/api/admin/users/${user.id}/shadow-ban`)
                .set('Cookie', admin.cookie)
                .send({ shadowBanned: false });

            expect(res2.status).toBe(200);
            expect(res2.body.data.isShadowBanned).toBe(false);
        });

        it('should validate shadowBanned boolean', async () => {
            const admin = await createTestAdmin('valshadow');
            const user = await createTestUser('student', 'valshadowuser');

            const res = await request(app)
                .post(`/api/admin/users/${user.id}/shadow-ban`)
                .set('Cookie', admin.cookie)
                .send({ shadowBanned: 'not a boolean' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('DELETE /api/admin/users/:id', () => {
        it('should delete user', async () => {
            const admin = await createTestAdmin('deleteuser');
            const user = await createTestUser('student', 'todelete');

            const res = await request(app)
                .delete(`/api/admin/users/${user.id}`)
                .set('Cookie', admin.cookie);

            expect(res.status).toBe(200);

            // Verify deleted
            const deleted = await User.findById(user.id);
            expect(deleted).toBeNull();
        });

        it('should return 404 for non-existent user', async () => {
            const admin = await createTestAdmin('deletenonexist');

            const res = await request(app)
                .delete('/api/admin/users/507f1f77bcf86cd799439011')
                .set('Cookie', admin.cookie);

            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/admin/companies', () => {
        it('should list all companies', async () => {
            const admin = await createTestAdmin('listcompanies');
            await createTestCompanyWithProfile('adminlist');

            const res = await request(app)
                .get('/api/admin/companies')
                .set('Cookie', admin.cookie);

            expect(res.status).toBe(200);
            expect(res.body.data).toBeDefined();
        });
    });

    describe('PUT /api/admin/companies/:id', () => {
        it('should update company verification', async () => {
            const admin = await createTestAdmin('verifycompany');
            const company = await createTestCompanyWithProfile('toverify');

            // Get company profile ID
            const profileRes = await request(app)
                .get('/api/companies/me')
                .set('Cookie', company.cookie);

            const companyId = profileRes.body.data._id;

            const res = await request(app)
                .put(`/api/admin/companies/${companyId}`)
                .set('Cookie', admin.cookie)
                .send({ verified: true });

            expect(res.status).toBe(200);
            expect(res.body.data.verified).toBe(true);
        });
    });

    describe('GET /api/admin/internships', () => {
        it('should list all internships', async () => {
            const admin = await createTestAdmin('listinternships');
            const company = await createTestCompanyWithProfile('internlist');

            await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Admin List Test',
                    description: DESC,
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            const res = await request(app)
                .get('/api/admin/internships')
                .set('Cookie', admin.cookie);

            expect(res.status).toBe(200);
            expect(res.body.data).toBeDefined();
        });
    });

    describe('PUT /api/admin/internships/:id', () => {
        it('should toggle internship active status', async () => {
            const admin = await createTestAdmin('toggleintern');
            const company = await createTestCompanyWithProfile('toggletest');

            const createRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Toggle Test',
                    description: DESC,
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            const res = await request(app)
                .put(`/api/admin/internships/${createRes.body.data._id}`)
                .set('Cookie', admin.cookie)
                .send({ status: 'inactive' });

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('inactive');
        });
    });

    describe('DELETE /api/admin/internships/:id', () => {
        it('should delete internship', async () => {
            const admin = await createTestAdmin('deleteintern');
            const company = await createTestCompanyWithProfile('deletetest');

            const createRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'To Delete',
                    description: DESC,
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            const res = await request(app)
                .delete(`/api/admin/internships/${createRes.body.data._id}`)
                .set('Cookie', admin.cookie);

            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/admin/settings', () => {
        it('should return system settings', async () => {
            const admin = await createTestAdmin('getsettings');

            const res = await request(app)
                .get('/api/admin/settings')
                .set('Cookie', admin.cookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('PUT /api/admin/settings', () => {
        it('should update system settings', async () => {
            const admin = await createTestAdmin('updatesettings');

            const res = await request(app)
                .put('/api/admin/settings')
                .set('Cookie', admin.cookie)
                .send({
                    siteName: 'Test Site',
                    maxFileSize: 10
                });

            expect(res.status).toBe(200);
        });
    });
});
