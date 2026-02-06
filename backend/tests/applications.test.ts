import { request, app, createTestCompanyWithProfile, createTestStudentWithProfile } from './helpers';
import Notification from '../models/Notification';

// Helper constant for valid descriptions (20+ chars required by Zod)
const DESC = 'This is a valid test description that meets the minimum length requirement';

describe('Applications API', () => {
    describe('POST /api/applications/internships/:id/apply', () => {
        it('should allow student to apply for internship', async () => {
            const company = await createTestCompanyWithProfile('apply');
            const student = await createTestStudentWithProfile('apply');

            // Create internship (via /api/internships with company auth)
            const internshipRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Apply Test Internship',
                    description: DESC,
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            expect(internshipRes.status).toBe(201);

            // Apply via /api/applications/internships/:id/apply
            const res = await request(app)
                .post(`/api/applications/internships/${internshipRes.body.data._id}/apply`)
                .set('Cookie', student.cookie)
                .send({ notes: 'I am very interested!' });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('pending');
        });

        it('should create notification for company', async () => {
            const company = await createTestCompanyWithProfile('notify');
            const student = await createTestStudentWithProfile('notify');

            const internshipRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Notification Test',
                    description: DESC,
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            expect(internshipRes.status).toBe(201);

            await request(app)
                .post(`/api/applications/internships/${internshipRes.body.data._id}/apply`)
                .set('Cookie', student.cookie)
                .send({});

            // Check notification was created
            const notifications = await Notification.find({ userId: company.id });
            expect(notifications.length).toBeGreaterThan(0);
            expect(notifications[0].type).toBe('application');
        });

        it('should reject duplicate application', async () => {
            const company = await createTestCompanyWithProfile('dup');
            const student = await createTestStudentWithProfile('dup');

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

            expect(internshipRes.status).toBe(201);

            // First application
            const firstApply = await request(app)
                .post(`/api/applications/internships/${internshipRes.body.data._id}/apply`)
                .set('Cookie', student.cookie)
                .send({});
            expect(firstApply.status).toBe(201);

            // Second application (should fail)
            const res = await request(app)
                .post(`/api/applications/internships/${internshipRes.body.data._id}/apply`)
                .set('Cookie', student.cookie)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('already applied');
        });

        it('should reject company from applying', async () => {
            const company1 = await createTestCompanyWithProfile('owner2');
            const company2 = await createTestCompanyWithProfile('applier');

            const internshipRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company1.cookie)
                .send({
                    title: 'Company Apply Test',
                    description: DESC,
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            expect(internshipRes.status).toBe(201);

            const res = await request(app)
                .post(`/api/applications/internships/${internshipRes.body.data._id}/apply`)
                .set('Cookie', company2.cookie)
                .send({});

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/applications/my', () => {
        it('should return student applications', async () => {
            const company = await createTestCompanyWithProfile('myapps');
            const student = await createTestStudentWithProfile('myapps');

            // Create and apply to internships
            const int1 = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Internship 1',
                    description: DESC,
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            expect(int1.status).toBe(201);

            const int2 = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Internship 2',
                    description: DESC,
                    skillsRequired: ['Python'],
                    durationWeeks: 12,
                    stipend: 15000,
                    mode: 'hybrid',
                    openings: 2
                });

            expect(int2.status).toBe(201);

            await request(app)
                .post(`/api/applications/internships/${int1.body.data._id}/apply`)
                .set('Cookie', student.cookie)
                .send({});

            await request(app)
                .post(`/api/applications/internships/${int2.body.data._id}/apply`)
                .set('Cookie', student.cookie)
                .send({});

            const res = await request(app)
                .get('/api/applications/my')
                .set('Cookie', student.cookie);

            expect(res.status).toBe(200);
            expect(res.body.count).toBe(2);
        });
    });

    describe('GET /api/applications/internship/:id', () => {
        it('should return applications for company internship', async () => {
            const company = await createTestCompanyWithProfile('intapps');
            const student1 = await createTestStudentWithProfile('intapps1');
            const student2 = await createTestStudentWithProfile('intapps2');

            const internshipRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Many Applicants',
                    description: DESC,
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 20000,
                    mode: 'remote',
                    openings: 5
                });

            expect(internshipRes.status).toBe(201);

            await request(app)
                .post(`/api/applications/internships/${internshipRes.body.data._id}/apply`)
                .set('Cookie', student1.cookie)
                .send({});

            await request(app)
                .post(`/api/applications/internships/${internshipRes.body.data._id}/apply`)
                .set('Cookie', student2.cookie)
                .send({});

            const res = await request(app)
                .get(`/api/applications/internship/${internshipRes.body.data._id}`)
                .set('Cookie', company.cookie);

            expect(res.status).toBe(200);
            expect(res.body.count).toBe(2);
        });

        it('should reject unauthorized company', async () => {
            const company1 = await createTestCompanyWithProfile('ownerapp');
            const company2 = await createTestCompanyWithProfile('snooper');
            const student = await createTestStudentWithProfile('victim');

            const internshipRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company1.cookie)
                .send({
                    title: 'Private Apps',
                    description: DESC,
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            expect(internshipRes.status).toBe(201);

            await request(app)
                .post(`/api/applications/internships/${internshipRes.body.data._id}/apply`)
                .set('Cookie', student.cookie)
                .send({});

            const res = await request(app)
                .get(`/api/applications/internship/${internshipRes.body.data._id}`)
                .set('Cookie', company2.cookie);

            expect(res.status).toBe(403);
        });
    });

    describe('PATCH /api/applications/:id/status', () => {
        it('should update application status', async () => {
            const company = await createTestCompanyWithProfile('status');
            const student = await createTestStudentWithProfile('status');

            const internshipRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Status Test',
                    description: DESC,
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            expect(internshipRes.status).toBe(201);

            const applyRes = await request(app)
                .post(`/api/applications/internships/${internshipRes.body.data._id}/apply`)
                .set('Cookie', student.cookie)
                .send({});

            expect(applyRes.status).toBe(201);

            const res = await request(app)
                .patch(`/api/applications/${applyRes.body.data._id}/status`)
                .set('Cookie', company.cookie)
                .send({ status: 'shortlisted' });

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('shortlisted');
        });

        it('should create notification for student on status update', async () => {
            const company = await createTestCompanyWithProfile('statusnotify');
            const student = await createTestStudentWithProfile('statusnotify');

            const internshipRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Status Notify Test',
                    description: DESC,
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            expect(internshipRes.status).toBe(201);

            const applyRes = await request(app)
                .post(`/api/applications/internships/${internshipRes.body.data._id}/apply`)
                .set('Cookie', student.cookie)
                .send({});

            expect(applyRes.status).toBe(201);

            await request(app)
                .patch(`/api/applications/${applyRes.body.data._id}/status`)
                .set('Cookie', company.cookie)
                .send({ status: 'accepted' });

            // Check notification was created for student
            const notifications = await Notification.find({ userId: student.id });
            const statusNotification = notifications.find(n => n.type === 'status_update');
            expect(statusNotification).toBeDefined();
        });
    });

    describe('Application Edge Cases', () => {
        it('should reject application to non-existent internship', async () => {
            const student = await createTestStudentWithProfile('nonexist');

            const res = await request(app)
                .post('/api/applications/internships/507f1f77bcf86cd799439011/apply')
                .set('Cookie', student.cookie)
                .send({});

            expect(res.status).toBe(404);
        });

        it('should reject application to inactive internship', async () => {
            const company = await createTestCompanyWithProfile('inactive');
            const student = await createTestStudentWithProfile('toinactive');

            // Create internship
            const internshipRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Inactive Internship',
                    description: DESC,
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            // Deactivate internship
            await request(app)
                .put(`/api/internships/${internshipRes.body.data._id}`)
                .set('Cookie', company.cookie)
                .send({ isActive: false });

            // Try to apply
            const res = await request(app)
                .post(`/api/applications/internships/${internshipRes.body.data._id}/apply`)
                .set('Cookie', student.cookie)
                .send({});

            expect(res.status).toBe(400);
        });

        it('should reject unauthenticated application', async () => {
            const res = await request(app)
                .post('/api/applications/internships/507f1f77bcf86cd799439011/apply')
                .send({});

            expect(res.status).toBe(401);
        });
    });
});
