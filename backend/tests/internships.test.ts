import { request, app, createTestCompanyWithProfile, createTestStudentWithProfile, createTestUser, createTestInternship } from './helpers';
import Internship from '../models/Internship';

// Helper constant for valid descriptions (20+ chars required by Zod)
const DESC = 'This is a valid test description that meets the minimum length requirement';

describe('Internships API', () => {
    describe('POST /api/internships', () => {
        it('should create internship as company', async () => {
            const company = await createTestCompanyWithProfile('create');

            const res = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Software Developer Intern',
                    description: 'Great opportunity for developers to learn and grow in a professional environment',
                    skillsRequired: ['JavaScript', 'React', 'Node.js'],
                    durationWeeks: 12,
                    stipend: 15000,
                    mode: 'remote',
                    openings: 3
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe('Software Developer Intern');
            expect(res.body.data.isActive).toBe(true);
        });

        it('should reject non-company role', async () => {
            const student = await createTestUser('student', 'notcompany');

            const res = await request(app)
                .post('/api/internships')
                .set('Cookie', student.cookie)
                .send({
                    title: 'Test Internship',
                    description: DESC,
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/internships', () => {
        it('should list all active internships', async () => {
            const company = await createTestCompanyWithProfile('list');

            // Create internship 1
            const int1Res = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Frontend Developer',
                    description: 'Frontend development work building amazing user interfaces',
                    skillsRequired: ['React', 'CSS'],
                    durationWeeks: 8,
                    stipend: 12000,
                    mode: 'remote',
                    openings: 2
                });
            expect(int1Res.status).toBe(201);

            // Create internship 2
            const int2Res = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Backend Developer',
                    description: 'Backend development work with Node.js and MongoDB databases',
                    skillsRequired: ['Node.js', 'MongoDB'],
                    durationWeeks: 10,
                    stipend: 15000,
                    mode: 'hybrid',
                    openings: 1
                });
            expect(int2Res.status).toBe(201);

            const res = await request(app).get('/api/internships');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.count).toBeGreaterThanOrEqual(2);
        });

        it('should filter by mode', async () => {
            const company = await createTestCompanyWithProfile('filter');

            // Create remote internship
            await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Remote Intern',
                    description: 'Remote work opportunity for software developers',
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            // Create onsite internship
            await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Onsite Intern',
                    description: 'Onsite work opportunity at our headquarters',
                    skillsRequired: ['Python'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'onsite',
                    openings: 1
                });

            const res = await request(app)
                .get('/api/internships')
                .query({ mode: 'remote' });

            expect(res.status).toBe(200);
            // All returned internships should be remote
            expect(res.body.data.every((i: any) => i.mode === 'remote')).toBe(true);
        });

        it('should filter by minimum stipend', async () => {
            const company = await createTestCompanyWithProfile('stipend');

            await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Low Stipend',
                    description: 'Entry level internship with competitive benefits',
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 5000,
                    mode: 'remote',
                    openings: 1
                });

            await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'High Stipend',
                    description: 'Senior level internship with high compensation',
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 20000,
                    mode: 'remote',
                    openings: 1
                });

            const res = await request(app)
                .get('/api/internships')
                .query({ minStipend: '15000' });

            expect(res.status).toBe(200);
            expect(res.body.data.every((i: any) => i.stipend >= 15000)).toBe(true);
        });
    });

    describe('GET /api/internships/:id', () => {
        it('should get single internship', async () => {
            const company = await createTestCompanyWithProfile('single');

            const createRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Single Internship',
                    description: 'A single internship listing for testing purposes',
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            expect(createRes.status).toBe(201);
            expect(createRes.body.data).toBeDefined();
            expect(createRes.body.data._id).toBeDefined();

            const res = await request(app)
                .get(`/api/internships/${createRes.body.data._id}`);

            expect(res.status).toBe(200);
            expect(res.body.data.title).toBe('Single Internship');
        });

        it('should return 404 for non-existent internship', async () => {
            const res = await request(app)
                .get('/api/internships/507f1f77bcf86cd799439011');

            expect(res.status).toBe(404);
        });
    });

    describe('PUT /api/internships/:id', () => {
        it('should update own internship', async () => {
            const company = await createTestCompanyWithProfile('update');

            const createRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Original Title',
                    description: 'Original description for this internship listing',
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            expect(createRes.status).toBe(201);
            expect(createRes.body.data._id).toBeDefined();

            const res = await request(app)
                .put(`/api/internships/${createRes.body.data._id}`)
                .set('Cookie', company.cookie)
                .send({
                    title: 'Updated Title',
                    stipend: 15000
                });

            expect(res.status).toBe(200);
            expect(res.body.data.title).toBe('Updated Title');
            expect(res.body.data.stipend).toBe(15000);
        });

        it('should reject update from other company', async () => {
            const company1 = await createTestCompanyWithProfile('owner');
            const company2 = await createTestCompanyWithProfile('other');

            const createRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company1.cookie)
                .send({
                    title: 'Company1 Internship',
                    description: 'An internship belonging to company one only',
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            expect(createRes.status).toBe(201);
            expect(createRes.body.data._id).toBeDefined();

            const res = await request(app)
                .put(`/api/internships/${createRes.body.data._id}`)
                .set('Cookie', company2.cookie)
                .send({ title: 'Hacked Title' });

            expect(res.status).toBe(403);
        });
    });

    describe('DELETE /api/internships/:id', () => {
        it('should delete own internship', async () => {
            const company = await createTestCompanyWithProfile('delete');

            const createRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'To Delete',
                    description: 'This internship will be deleted during testing',
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            expect(createRes.status).toBe(201);
            expect(createRes.body.data._id).toBeDefined();

            const res = await request(app)
                .delete(`/api/internships/${createRes.body.data._id}`)
                .set('Cookie', company.cookie);

            expect(res.status).toBe(200);

            // Verify deleted
            const checkRes = await request(app)
                .get(`/api/internships/${createRes.body.data._id}`);
            expect(checkRes.status).toBe(404);
        });
    });

    describe('GET /api/internships/match (Skill Match)', () => {
        it('should return matched internships for student', async () => {
            const company = await createTestCompanyWithProfile('match');
            const student = await createTestStudentWithProfile('match');

            // Create a matching internship (student has: JavaScript, React, Node.js)
            await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Perfect Match',
                    description: 'A perfect matching internship for JavaScript developers',
                    skillsRequired: ['JavaScript', 'React'],
                    durationWeeks: 8,
                    stipend: 15000,
                    mode: 'remote',
                    openings: 1
                });

            // Create a non-matching internship
            await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'No Match',
                    description: 'An internship for Python and Django developers only',
                    skillsRequired: ['Python', 'Django'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            const res = await request(app)
                .get('/api/internships/match')
                .set('Cookie', student.cookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            // First result should have higher match score
            if (res.body.data.length >= 2) {
                expect(res.body.data[0].matchScore).toBeGreaterThanOrEqual(res.body.data[1].matchScore);
            }
        });
    });
});
