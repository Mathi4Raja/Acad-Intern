import { request, app, createTestUser, createTestAdmin, createTestCompanyWithProfile, createTestStudentWithProfile } from './helpers';
import Report from '../models/Report';

// Helper constant for valid descriptions
const DESC = 'This is a valid test description that meets the minimum length requirement';

describe('Reports API', () => {
    describe('POST /api/reports', () => {
        it('should create report with internshipId', async () => {
            const student = await createTestStudentWithProfile('reporter');
            const company = await createTestCompanyWithProfile('reported');

            // Create an internship to report
            const internshipRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Internship to Report',
                    description: DESC,
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            const res = await request(app)
                .post('/api/reports')
                .set('Cookie', student.cookie)
                .send({
                    internshipId: internshipRes.body.data._id,
                    subject: 'Report: Misleading Info',
                    body: 'This internship has misleading information'
                });

            expect(res.status).toBe(201);
            expect(res.body.data.status).toBe('open');
        });

        it('should reject short reason (validation)', async () => {
            const student = await createTestStudentWithProfile('shortreport');
            const company = await createTestCompanyWithProfile('shortreported');

            const internshipRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Short Report Test',
                    description: DESC,
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            const res = await request(app)
                .post('/api/reports')
                .set('Cookie', student.cookie)
                .send({
                    internshipId: internshipRes.body.data._id,
                    subject: 'Short',
                    body: 'Bad' // Too short (< 5 chars)
                });

            // Zod validation errors go through error handler
            expect(res.status).not.toBe(201);
        });

        it('should reject unauthenticated report creation', async () => {
            const res = await request(app)
                .post('/api/reports')
                .send({
                    reason: 'This is a valid reason for reporting'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/reports', () => {
        it('should return reports for admin only', async () => {
            const admin = await createTestAdmin('reportadmin');

            const res = await request(app)
                .get('/api/reports')
                .set('Cookie', admin.cookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            if (res.body.data.length > 0) {
                expect(res.body.data[0]).toHaveProperty('subject');
                expect(res.body.data[0]).toHaveProperty('body');
            }
        });

        it('should reject student access', async () => {
            const student = await createTestUser('student', 'noadminreport');

            const res = await request(app)
                .get('/api/reports')
                .set('Cookie', student.cookie);

            expect(res.status).toBe(403);
        });

        it('should return a single report with mapped id for admin', async () => {
            const admin = await createTestAdmin('singlereportadmin');

            // Create a report first
            const report = await Report.create({
                reporterId: admin.id,
                subject: 'Test Subject',
                body: 'Test Body',
                category: 'other',
                priority: 'medium',
                status: 'open'
            });

            const res = await request(app)
                .get(`/api/reports/${report._id}`)
                .set('Cookie', admin.cookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.id.toString()).toBe(report._id.toString());
            expect(res.body.data).toHaveProperty('type');
            expect(res.body.data).toHaveProperty('reportedBy');
        });

        it('should reject company access', async () => {
            const company = await createTestCompanyWithProfile('noadmin');

            const res = await request(app)
                .get('/api/reports')
                .set('Cookie', company.cookie);

            expect(res.status).toBe(403);
        });
    });
});
