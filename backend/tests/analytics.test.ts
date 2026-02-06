import { request, app, createTestUser, createTestStudentWithProfile, createTestCompanyWithProfile } from './helpers';

describe('Analytics API', () => {
    describe('GET /api/analytics/student', () => {
        it('should return student analytics', async () => {
            const student = await createTestStudentWithProfile('analytics');

            const res = await request(app)
                .get('/api/analytics/student')
                .set('Cookie', student.cookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
        });

        it('should reject company access', async () => {
            const company = await createTestCompanyWithProfile('noaccess');

            const res = await request(app)
                .get('/api/analytics/student')
                .set('Cookie', company.cookie);

            expect(res.status).toBe(403);
        });

        it('should reject unauthenticated access', async () => {
            const res = await request(app)
                .get('/api/analytics/student');

            expect(res.status).toBe(401);
        });

        it('should include analytics data', async () => {
            const student = await createTestStudentWithProfile('fullanalytics');

            const res = await request(app)
                .get('/api/analytics/student')
                .set('Cookie', student.cookie);

            expect(res.status).toBe(200);
            // Analytics should have some structure
            expect(res.body.data).toBeDefined();
        });
    });
});
