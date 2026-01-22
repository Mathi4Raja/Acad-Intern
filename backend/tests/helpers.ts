import request from 'supertest';
import { app } from '../server';
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import Company from '../models/Company';

export interface TestUser {
    id: string;
    email: string;
    password: string;
    name: string;
    role: 'student' | 'company' | 'admin';
    cookie: string;
}

/**
 * Create a test user and return with auth cookie
 */
export async function createTestUser(
    role: 'student' | 'company' | 'admin' = 'student',
    suffix: string = ''
): Promise<TestUser> {
    const email = `test${role}${suffix}@example.com`;
    const password = 'Test1234!';
    const name = `Test ${role.charAt(0).toUpperCase() + role.slice(1)}${suffix}`;

    const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({ email, password, name, role });

    const cookie = signupRes.headers['set-cookie']?.[0] || '';

    return {
        id: signupRes.body.data?.user?.id || signupRes.body.data?.user?._id,
        email,
        password,
        name,
        role,
        cookie
    };
}

/**
 * Login and get auth cookie
 */
export async function loginUser(email: string, password: string): Promise<string> {
    const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

    return res.headers['set-cookie']?.[0] || '';
}

/**
 * Create a complete test student with profile
 */
export async function createTestStudentWithProfile(suffix: string = ''): Promise<TestUser & { profileId: string }> {
    const user = await createTestUser('student', suffix);

    // Update profile
    const profileRes = await request(app)
        .post('/api/students/profile')
        .set('Cookie', user.cookie)
        .send({
            department: 'Computer Science',
            semester: 6,
            skills: ['JavaScript', 'React', 'Node.js']
        });

    return {
        ...user,
        profileId: profileRes.body.data?._id
    };
}

/**
 * Create a test company with profile
 * Note: When a company user signs up, a Company record is auto-created.
 * This function gets the existing company and updates its profile.
 */
export async function createTestCompanyWithProfile(suffix: string = ''): Promise<TestUser & { companyId: string }> {
    const user = await createTestUser('company', suffix);

    // Get existing company profile (created during signup)
    const getRes = await request(app)
        .get('/api/companies/me')
        .set('Cookie', user.cookie);

    // Update company profile with more details
    await request(app)
        .post('/api/companies')
        .set('Cookie', user.cookie)
        .send({
            companyName: `Test Company${suffix}`,
            website: `https://testcompany${suffix.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            description: 'A test company for testing purposes'
        });

    return {
        ...user,
        companyId: getRes.body.data?._id
    };
}

/**
 * Create a test internship and return its ID
 */
export async function createTestInternship(companyUserCookie: string, suffix: string = ''): Promise<string> {
    const res = await request(app)
        .post('/api/internships')
        .set('Cookie', companyUserCookie)
        .send({
            title: `Test Internship${suffix}`,
            description: 'A test internship for testing purposes',
            skillsRequired: ['JavaScript', 'React'],
            durationWeeks: 8,
            stipend: 15000,
            mode: 'remote',
            openings: 3
        });

    return res.body.data?._id;
}

export { request, app };
