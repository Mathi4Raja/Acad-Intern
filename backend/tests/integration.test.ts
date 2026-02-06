import { request, app, createTestUser, createTestAdmin, createTestCompanyWithProfile, createTestStudentWithProfile } from './helpers';
import Notification from '../models/Notification';

// Helper constant for valid descriptions
const DESC = 'This is a valid test description that meets the minimum length requirement';

describe('Integration Tests', () => {
    describe('Complete Application Flow', () => {
        it('should complete full application lifecycle', async () => {
            // 1. Setup: Create company with profile
            const company = await createTestCompanyWithProfile('flow');
            const student = await createTestStudentWithProfile('flow');

            // 2. Company creates internship
            const internshipRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Full Flow Test',
                    description: DESC,
                    skillsRequired: ['JavaScript', 'React'],
                    durationWeeks: 12,
                    stipend: 20000,
                    mode: 'remote',
                    openings: 1
                });
            expect(internshipRes.status).toBe(201);
            const internshipId = internshipRes.body.data._id;

            // 3. Student applies
            const applyRes = await request(app)
                .post(`/api/applications/internships/${internshipId}/apply`)
                .set('Cookie', student.cookie)
                .send({ notes: 'I am excited to apply!' });
            expect(applyRes.status).toBe(201);
            const applicationId = applyRes.body.data._id;

            // 4. Verify company notification
            const companyNotifs = await Notification.find({ userId: company.id });
            expect(companyNotifs.some(n => n.type === 'application')).toBe(true);

            // 5. Company reviews and shortlists
            const shortlistRes = await request(app)
                .patch(`/api/applications/${applicationId}/status`)
                .set('Cookie', company.cookie)
                .send({ status: 'shortlisted' });
            expect(shortlistRes.status).toBe(200);
            expect(shortlistRes.body.data.status).toBe('shortlisted');

            // 6. Company sends message
            const msgRes = await request(app)
                .post(`/api/messages/application/${applicationId}`)
                .set('Cookie', company.cookie)
                .send({ content: 'Congratulations! We would like to schedule an interview.' });
            expect(msgRes.status).toBe(201);

            // 7. Student views messages
            const viewMsgRes = await request(app)
                .get(`/api/messages/application/${applicationId}`)
                .set('Cookie', student.cookie);
            expect(viewMsgRes.status).toBe(200);
            expect(viewMsgRes.body.data.length).toBeGreaterThan(0);

            // 8. Company accepts student
            const acceptRes = await request(app)
                .patch(`/api/applications/${applicationId}/status`)
                .set('Cookie', company.cookie)
                .send({ status: 'accepted' });
            expect(acceptRes.status).toBe(200);
            expect(acceptRes.body.data.status).toBe('accepted');

            // 9. Verify student notification
            const studentNotifs = await Notification.find({ userId: student.id });
            expect(studentNotifs.some(n => n.type === 'status_update')).toBe(true);
        });
    });

    describe('Cross-Role Permission Matrix', () => {
        it('should prevent student from accessing company routes', async () => {
            const student = await createTestStudentWithProfile('crossrole1');

            const res = await request(app)
                .get('/api/companies/me')
                .set('Cookie', student.cookie);

            expect(res.status).toBe(403);
        });

        it('should prevent company from accessing student-only routes', async () => {
            const company = await createTestCompanyWithProfile('crossrole2');

            const res = await request(app)
                .get('/api/students/profile/me')
                .set('Cookie', company.cookie);

            expect(res.status).toBe(403);
        });

        it('should prevent non-admin from accessing admin routes', async () => {
            const student = await createTestStudentWithProfile('crossrole3');
            const company = await createTestCompanyWithProfile('crossrole4');

            const studentRes = await request(app)
                .get('/api/admin/stats')
                .set('Cookie', student.cookie);
            expect(studentRes.status).toBe(403);

            const companyRes = await request(app)
                .get('/api/admin/stats')
                .set('Cookie', company.cookie);
            expect(companyRes.status).toBe(403);
        });

        it('should allow admin to access admin routes', async () => {
            const admin = await createTestAdmin('crossrole5');

            const res = await request(app)
                .get('/api/admin/stats')
                .set('Cookie', admin.cookie);

            expect(res.status).toBe(200);
        });
    });

    describe('Error Handling', () => {
        it('should return error for invalid ObjectId', async () => {
            const student = await createTestStudentWithProfile('errortest');

            const res = await request(app)
                .get('/api/internships/invalid-id')
                .set('Cookie', student.cookie);

            // Invalid ObjectId causes CastError → 500
            expect(res.status).not.toBe(200);
        });

        it('should return 404 for non-existent resource', async () => {
            const res = await request(app)
                .get('/api/internships/507f1f77bcf86cd799439011');

            expect(res.status).toBe(404);
        });

        it('should return 400 for duplicate application', async () => {
            const company = await createTestCompanyWithProfile('duplicate');
            const student = await createTestStudentWithProfile('duplicate');

            const internshipRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Duplicate Test',
                    description: DESC,
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            // First application
            await request(app)
                .post(`/api/applications/internships/${internshipRes.body.data._id}/apply`)
                .set('Cookie', student.cookie)
                .send({});

            // Duplicate application
            const dupRes = await request(app)
                .post(`/api/applications/internships/${internshipRes.body.data._id}/apply`)
                .set('Cookie', student.cookie)
                .send({});

            expect(dupRes.status).toBe(400);
        });
    });

    describe('Authentication Edge Cases', () => {
        it('should reject expired/invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Cookie', 'token=invalid.jwt.token');

            expect(res.status).toBe(401);
        });

        it('should reject request without token', async () => {
            const res = await request(app)
                .get('/api/auth/me');

            expect(res.status).toBe(401);
        });
    });
});
