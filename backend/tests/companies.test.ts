import { request, app, createTestUser, createTestCompanyWithProfile, createTestStudentWithProfile } from './helpers';
import Company from '../models/Company';

describe('Companies API', () => {
    describe('GET /api/companies/me', () => {
        it('should return company profile for authenticated company', async () => {
            const company = await createTestCompanyWithProfile('me');

            const res = await request(app)
                .get('/api/companies/me')
                .set('Cookie', company.cookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
            expect(res.body.data.userId).toBeDefined();
        });

        it('should reject student access', async () => {
            const student = await createTestUser('student', 'companyroute');

            const res = await request(app)
                .get('/api/companies/me')
                .set('Cookie', student.cookie);

            expect(res.status).toBe(403);
        });

        it('should reject unauthenticated access', async () => {
            const res = await request(app)
                .get('/api/companies/me');

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/companies', () => {
        it('should update company profile', async () => {
            const company = await createTestCompanyWithProfile('update');

            const res = await request(app)
                .post('/api/companies')
                .set('Cookie', company.cookie)
                .send({
                    companyName: 'Updated Company Name',
                    website: 'https://updated-company.com',
                    description: 'Updated description',
                    location: 'New York',
                    industry: 'Technology'
                });

            expect(res.status).toBe(200);
            expect(res.body.data.companyName).toBe('Updated Company Name');
            expect(res.body.data.location).toBe('New York');
        });

        it('should validate website URL format', async () => {
            const company = await createTestCompanyWithProfile('urltest');

            const res = await request(app)
                .post('/api/companies')
                .set('Cookie', company.cookie)
                .send({
                    website: 'not-a-valid-url'
                });

            expect(res.status).toBe(400);
        });

        it('should accept empty website', async () => {
            const company = await createTestCompanyWithProfile('emptyurl');

            const res = await request(app)
                .post('/api/companies')
                .set('Cookie', company.cookie)
                .send({
                    website: ''
                });

            expect(res.status).toBe(200);
        });

        it('should update social links', async () => {
            const company = await createTestCompanyWithProfile('social');

            const res = await request(app)
                .post('/api/companies')
                .set('Cookie', company.cookie)
                .send({
                    socialLinks: {
                        linkedin: 'https://linkedin.com/company/test',
                        twitter: 'https://twitter.com/test'
                    }
                });

            expect(res.status).toBe(200);
            expect(res.body.data.socialLinks.linkedin).toBe('https://linkedin.com/company/test');
        });

        it('should update all optional fields', async () => {
            const company = await createTestCompanyWithProfile('allfields');

            const res = await request(app)
                .post('/api/companies')
                .set('Cookie', company.cookie)
                .send({
                    companySize: '50-100',
                    founded: '2020',
                    phone: '+1234567890',
                    about: 'About our company',
                    benefits: 'Health insurance, Remote work'
                });

            expect(res.status).toBe(200);
            expect(res.body.data.companySize).toBe('50-100');
            expect(res.body.data.founded).toBe('2020');
        });
    });

    describe('GET /api/companies/:id', () => {
        it('should return company by ID for authenticated user', async () => {
            const company = await createTestCompanyWithProfile('byid');
            const student = await createTestStudentWithProfile('viewer');

            // Get company ID from the company's own profile
            const profileRes = await request(app)
                .get('/api/companies/me')
                .set('Cookie', company.cookie);

            const companyId = profileRes.body.data._id;

            const res = await request(app)
                .get(`/api/companies/${companyId}`)
                .set('Cookie', student.cookie);

            expect(res.status).toBe(200);
            expect(res.body.data._id).toBe(companyId);
        });

        it('should return 404 for non-existent company', async () => {
            const student = await createTestStudentWithProfile('notfound');

            const res = await request(app)
                .get('/api/companies/507f1f77bcf86cd799439011')
                .set('Cookie', student.cookie);

            expect(res.status).toBe(404);
        });

        it('should reject unauthenticated access', async () => {
            const res = await request(app)
                .get('/api/companies/507f1f77bcf86cd799439011');

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/companies/verify-cin', () => {
        it('should reject CIN with invalid length', async () => {
            const company = await createTestCompanyWithProfile('cinshort');

            const res = await request(app)
                .post('/api/companies/verify-cin')
                .set('Cookie', company.cookie)
                .send({
                    cin: 'TOOSHORT'
                });

            expect(res.status).toBe(400);
        });

        it('should require exactly 21 characters for CIN', async () => {
            const company = await createTestCompanyWithProfile('cin21');

            // CIN too long
            const res = await request(app)
                .post('/api/companies/verify-cin')
                .set('Cookie', company.cookie)
                .send({
                    cin: 'U74999MH2020PTC123456789' // 24 chars
                });

            expect(res.status).toBe(400);
        });
    });
});
