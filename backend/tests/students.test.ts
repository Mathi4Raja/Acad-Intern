import { request, app, createTestUser, createTestCompanyWithProfile, createTestStudentWithProfile } from './helpers';
import StudentProfile from '../models/StudentProfile';

describe('Students API', () => {
    describe('GET /api/students/profile/me', () => {
        it('should return student profile', async () => {
            const student = await createTestStudentWithProfile('getme');

            const res = await request(app)
                .get('/api/students/profile/me')
                .set('Cookie', student.cookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.userId).toBeDefined();
        });

        it('should reject company access', async () => {
            const company = await createTestCompanyWithProfile('studentroute');

            const res = await request(app)
                .get('/api/students/profile/me')
                .set('Cookie', company.cookie);

            expect(res.status).toBe(403);
        });

        it('should reject unauthenticated access', async () => {
            const res = await request(app)
                .get('/api/students/profile/me');

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/students/profile', () => {
        it('should update student profile', async () => {
            const student = await createTestStudentWithProfile('update');

            const res = await request(app)
                .post('/api/students/profile')
                .set('Cookie', student.cookie)
                .send({
                    department: 'Computer Science',
                    semester: 6,
                    skills: ['Python', 'Machine Learning'],
                    bio: 'A passionate developer',
                    location: 'San Francisco'
                });

            expect(res.status).toBe(200);
            expect(res.body.data.department).toBe('Computer Science');
            expect(res.body.data.semester).toBe(6);
        });

        it('should validate semester range (1-8)', async () => {
            const student = await createTestStudentWithProfile('semrange');

            // Semester too low
            const res1 = await request(app)
                .post('/api/students/profile')
                .set('Cookie', student.cookie)
                .send({ semester: 0 });

            expect(res1.status).toBe(400);

            // Semester too high
            const res2 = await request(app)
                .post('/api/students/profile')
                .set('Cookie', student.cookie)
                .send({ semester: 10 });

            expect(res2.status).toBe(400);
        });

        it('should validate CGPA range (0-10)', async () => {
            const student = await createTestStudentWithProfile('cgparange');

            // CGPA too high
            const res = await request(app)
                .post('/api/students/profile')
                .set('Cookie', student.cookie)
                .send({ cgpa: 11 });

            expect(res.status).toBe(400);
        });

        it('should accept valid CGPA', async () => {
            const student = await createTestStudentWithProfile('cgpavalid');

            const res = await request(app)
                .post('/api/students/profile')
                .set('Cookie', student.cookie)
                .send({ cgpa: 8.5 });

            expect(res.status).toBe(200);
            expect(res.body.data.cgpa).toBe(8.5);
        });

        it('should update skills array', async () => {
            const student = await createTestStudentWithProfile('skills');

            const res = await request(app)
                .post('/api/students/profile')
                .set('Cookie', student.cookie)
                .send({
                    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js']
                });

            expect(res.status).toBe(200);
            expect(res.body.data.skills).toHaveLength(4);
            expect(res.body.data.skills).toContain('TypeScript');
        });

        it('should update social links', async () => {
            const student = await createTestStudentWithProfile('social');

            const res = await request(app)
                .post('/api/students/profile')
                .set('Cookie', student.cookie)
                .send({
                    linkedIn: 'https://linkedin.com/in/testuser',
                    github: 'https://github.com/testuser'
                });

            expect(res.status).toBe(200);
            expect(res.body.data.linkedIn).toBe('https://linkedin.com/in/testuser');
            expect(res.body.data.github).toBe('https://github.com/testuser');
        });

        it('should update hoursRequired', async () => {
            const student = await createTestStudentWithProfile('hours');

            const res = await request(app)
                .post('/api/students/profile')
                .set('Cookie', student.cookie)
                .send({ hoursRequired: 120 });

            expect(res.status).toBe(200);
            expect(res.body.data.hoursRequired).toBe(120);
        });
    });

    describe('GET /api/students/profile/:id', () => {
        it('should allow company to view student profile', async () => {
            const student = await createTestStudentWithProfile('viewable');
            const company = await createTestCompanyWithProfile('viewer');

            const res = await request(app)
                .get(`/api/students/profile/${student.id}`)
                .set('Cookie', company.cookie);

            expect(res.status).toBe(200);
            expect(res.body.data).toBeDefined();
        });

        it('should reject student viewing other student profile', async () => {
            const student1 = await createTestStudentWithProfile('s1');
            const student2 = await createTestStudentWithProfile('s2');

            const res = await request(app)
                .get(`/api/students/profile/${student1.id}`)
                .set('Cookie', student2.cookie);

            expect(res.status).toBe(403);
        });

        it('should return 404 for non-existent user', async () => {
            const company = await createTestCompanyWithProfile('notfound');

            const res = await request(app)
                .get('/api/students/profile/507f1f77bcf86cd799439011')
                .set('Cookie', company.cookie);

            expect(res.status).toBe(404);
        });

        it('should reject unauthenticated access', async () => {
            const res = await request(app)
                .get('/api/students/profile/507f1f77bcf86cd799439011');

            expect(res.status).toBe(401);
        });
    });

    describe('Profile Edge Cases', () => {
        it('should allow empty update (no changes)', async () => {
            const student = await createTestStudentWithProfile('emptyupdate');

            const res = await request(app)
                .post('/api/students/profile')
                .set('Cookie', student.cookie)
                .send({});

            expect(res.status).toBe(200);
        });

        it('should clear skills with empty array', async () => {
            const student = await createTestStudentWithProfile('clearskills');

            // First set skills
            await request(app)
                .post('/api/students/profile')
                .set('Cookie', student.cookie)
                .send({ skills: ['JavaScript', 'Python'] });

            // Then clear them
            const res = await request(app)
                .post('/api/students/profile')
                .set('Cookie', student.cookie)
                .send({ skills: [] });

            expect(res.status).toBe(200);
            expect(res.body.data.skills).toHaveLength(0);
        });

        it('should update location', async () => {
            const student = await createTestStudentWithProfile('location');

            const res = await request(app)
                .post('/api/students/profile')
                .set('Cookie', student.cookie)
                .send({ location: 'New York, USA' });

            expect(res.status).toBe(200);
        });

        it('should update multiple fields at once', async () => {
            const student = await createTestStudentWithProfile('multifield');

            const res = await request(app)
                .post('/api/students/profile')
                .set('Cookie', student.cookie)
                .send({
                    department: 'Data Science',
                    semester: 4,
                    skills: ['Python', 'TensorFlow'],
                    cgpa: 9.0,
                    bio: 'Machine learning enthusiast'
                });

            expect(res.status).toBe(200);
            expect(res.body.data.department).toBe('Data Science');
            expect(res.body.data.semester).toBe(4);
            expect(res.body.data.cgpa).toBe(9.0);
        });
    });
});
