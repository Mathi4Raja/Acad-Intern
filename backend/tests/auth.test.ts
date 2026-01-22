import { request, app, createTestUser, loginUser } from './helpers';
import User from '../models/User';

describe('Auth API', () => {
    describe('POST /api/auth/signup', () => {
        it('should register a new student', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'student@test.com',
                    password: 'Password123!',
                    name: 'Test Student',
                    role: 'student'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe('student@test.com');
            expect(res.body.data.user.role).toBe('student');
            expect(res.body.data.token).toBeDefined();
            expect(res.headers['set-cookie']).toBeDefined();
        });

        it('should register a new company', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'company@test.com',
                    password: 'Password123!',
                    name: 'Test Company User',
                    role: 'company'
                });

            expect(res.status).toBe(201);
            expect(res.body.data.user.role).toBe('company');
        });

        it('should reject duplicate email', async () => {
            await createTestUser('student', '1');

            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'teststudent1@example.com',
                    password: 'Password123!',
                    name: 'Duplicate User',
                    role: 'student'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should reject weak password', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'weak@test.com',
                    password: '123',
                    name: 'Weak Password',
                    role: 'student'
                });

            expect(res.status).toBe(400);
        });

        it('should reject invalid email', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'notanemail',
                    password: 'Password123!',
                    name: 'Invalid Email',
                    role: 'student'
                });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const user = await createTestUser('student', 'login');

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: user.email,
                    password: user.password
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(user.email);
            expect(res.headers['set-cookie']).toBeDefined();
        });

        it('should reject invalid password', async () => {
            const user = await createTestUser('student', 'wrongpass');

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: user.email,
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should reject non-existent user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'Password123!'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return current user when authenticated', async () => {
            const user = await createTestUser('student', 'me');

            const res = await request(app)
                .get('/api/auth/me')
                .set('Cookie', user.cookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(user.email);
        });

        it('should reject unauthenticated request', async () => {
            const res = await request(app)
                .get('/api/auth/me');

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout and clear cookie', async () => {
            const user = await createTestUser('student', 'logout');

            const res = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', user.cookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
