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

    describe('POST /api/auth/forgot-password', () => {
        it('should accept valid email for password reset', async () => {
            const user = await createTestUser('student', 'forgot');

            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: user.email });

            // Should return 200 even if email not found (security)
            expect(res.status).toBe(200);
        });

        it('should handle non-existent email gracefully', async () => {
            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' });

            // Should still return 200 (security - don't reveal if email exists)
            expect(res.status).toBe(200);
        });

        it('should reject missing email', async () => {
            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({});

            expect(res.status).not.toBe(200);
        });
    });

    describe('GET /api/auth/reset-password/:token', () => {
        it('should reject invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/reset-password/invalid-token-12345');

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/auth/reset-password/:token', () => {
        it('should reject invalid token', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password/invalid-token-12345')
                .send({ password: 'NewPassword123!' });

            expect(res.status).toBe(400);
        });

        it('should reject weak new password', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password/some-token')
                .send({ password: '123' });

            expect(res.status).toBe(400);
        });
    });

    describe('DELETE /api/auth/account', () => {
        it('should delete user account', async () => {
            const user = await createTestUser('student', 'delete');

            const res = await request(app)
                .delete('/api/auth/account')
                .set('Cookie', user.cookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify account is deleted
            const deletedUser = await User.findById(user.id);
            expect(deletedUser).toBeNull();
        });

        it('should reject unauthenticated request', async () => {
            const res = await request(app)
                .delete('/api/auth/account');

            expect(res.status).toBe(401);
        });
    });

    describe('Signup Edge Cases', () => {
        it('should reject empty request body', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({});

            expect(res.status).toBe(400);
        });

        it('should reject missing name', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'noname@test.com',
                    password: 'Password123!',
                    role: 'student'
                });

            expect(res.status).toBe(400);
        });

        it('should reject invalid role', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'invalid@test.com',
                    password: 'Password123!',
                    name: 'Invalid Role',
                    role: 'superadmin'
                });

            expect(res.status).toBe(400);
        });
    });

    describe('Login Edge Cases', () => {
        it('should reject empty request body', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(res.status).toBe(400);
        });

        it('should reject missing password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com' });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/auth/google', () => {
        it('should reject missing ID token', async () => {
            const res = await request(app)
                .post('/api/auth/google')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('ID token is required');
        });

        it('should reject invalid Google token', async () => {
            const res = await request(app)
                .post('/api/auth/google')
                .send({ idToken: 'invalid-token-12345' });

            // Invalid token should return 401
            expect(res.status).toBe(401);
        });

        it('should reject empty ID token', async () => {
            const res = await request(app)
                .post('/api/auth/google')
                .send({ idToken: '' });

            expect(res.status).toBe(400);
        });
    });
});
