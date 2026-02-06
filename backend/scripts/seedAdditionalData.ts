/**
 * Additive Seed Script - Preserves Existing Data
 * Run with: npx ts-node scripts/seedAdditionalData.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Import Models
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import Company from '../models/Company';
import Internship from '../models/Internship';
import Application from '../models/Application';
import Message from '../models/Message';
import Notification from '../models/Notification';

dotenv.config();

const GENERATED_USERS_FILE = path.join(__dirname, '../../others/GENERATED_USERS.md');

// --- Helper Functions ---
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubset = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const skillList = ['React', 'Node.js', 'Python', 'Java', 'TypeScript', 'AWS', 'Docker', 'Figma', 'MongoDB', 'PostgreSQL', 'GraphQL', 'Kubernetes'];
const locations = ['Bangalore', 'Mumbai', 'Delhi', 'Remote', 'Hyderabad', 'Pune', 'Chennai'];
const companyNames = ['InnovateTech', 'DataDriven Labs', 'CloudFirst Solutions', 'NextGen AI', 'FinPay Systems'];
const studentNames = ['Alex Johnson', 'Priya Sharma', 'Rahul Patel', 'Sara Ahmed', 'Vikram Singh', 'Neha Gupta'];

// --- Data Generators (Additive - check before creating) ---

async function createStudentIfNotExists(email: string, name: string) {
    let user = await User.findOne({ email });
    if (user) {
        console.log(`  [SKIP] Student ${email} already exists`);
        return user;
    }

    user = await User.create({
        name,
        email,
        password_hash: 'password123',
        role: 'student',
        isVerified: true,
        status: 'active'
    });

    await StudentProfile.create({
        userId: user._id,
        bio: `Passionate about ${getRandomElement(['software development', 'data science', 'AI/ML', 'web development'])}.`,
        skills: getRandomSubset(skillList, getRandomInt(3, 5)),
        department: getRandomElement(['Computer Science', 'Information Technology', 'Electronics', 'Mechanical']),
        location: getRandomElement(locations),
        completenessScore: getRandomInt(60, 100)
    });

    console.log(`  [NEW] Student: ${name} (${email})`);
    return user;
}

async function createCompanyIfNotExists(email: string, companyName: string) {
    let user = await User.findOne({ email });
    if (user) {
        console.log(`  [SKIP] Company ${email} already exists`);
        const profile = await Company.findOne({ userId: user._id });
        return { user, profile };
    }

    user = await User.create({
        name: companyName,
        email,
        password_hash: 'password123',
        role: 'company',
        isVerified: true,
        status: 'active'
    });

    const profile = await Company.create({
        userId: user._id,
        companyName,
        description: `${companyName} is a leading company in ${getRandomElement(['Fintech', 'Edtech', 'Healthtech', 'SaaS', 'E-commerce'])}.`,
        website: `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        location: getRandomElement(locations),
        industry: 'Technology',
        companySize: getRandomElement(['10-50', '50-200', '200-500']),
        verified: true
    });

    console.log(`  [NEW] Company: ${companyName} (${email})`);
    return { user, profile };
}

async function createInternshipsForCompany(companyProfile: any, count: number = 3) {
    const internshipTemplates = [
        { title: 'Software Developer Intern', stipend: 20000, mode: 'remote' },
        { title: 'Data Science Intern', stipend: 25000, mode: 'hybrid' },
        { title: 'Full Stack Developer', stipend: 22000, mode: 'remote' },
        { title: 'Mobile App Developer', stipend: 18000, mode: 'onsite' },
        { title: 'DevOps Engineer Intern', stipend: 24000, mode: 'remote' },
        { title: 'Machine Learning Intern', stipend: 28000, mode: 'hybrid' },
        { title: 'Backend Developer', stipend: 21000, mode: 'remote' },
        { title: 'QA Engineer Intern', stipend: 15000, mode: 'onsite' },
    ];

    const selectedTemplates = getRandomSubset(internshipTemplates, count);
    const createdInternships = [];

    for (const template of selectedTemplates) {
        const internship = await Internship.create({
            companyId: companyProfile._id,
            title: template.title,
            description: `We're looking for a talented ${template.title} to join our team. You'll work on exciting projects and gain valuable experience.`,
            requirements: 'Strong fundamentals in programming. Good problem-solving skills. Eager to learn.',
            responsibilities: 'Collaborate with the team on feature development. Write clean, maintainable code. Participate in code reviews.',
            skillsRequired: getRandomSubset(skillList, getRandomInt(3, 5)),
            durationWeeks: getRandomInt(8, 16),
            stipend: template.stipend + getRandomInt(-2000, 5000),
            mode: template.mode,
            openings: getRandomInt(1, 5),
            status: 'active',
            location: companyProfile.location,
            deadline: new Date(Date.now() + getRandomInt(15, 60) * 24 * 60 * 60 * 1000)
        });
        createdInternships.push(internship);
        console.log(`    [NEW] Internship: ${template.title}`);
    }

    return createdInternships;
}

async function createApplicationsForInternship(internshipId: string, students: any[], count: number = 3) {
    const selectedStudents = getRandomSubset(students, Math.min(count, students.length));
    const statuses = ['pending', 'shortlisted', 'assessment_completed', 'accepted', 'rejected'];

    for (const student of selectedStudents) {
        // Check if application already exists
        const existing = await Application.findOne({ internshipId, studentId: student._id });
        if (existing) continue;

        await Application.create({
            internshipId,
            studentId: student._id,
            status: getRandomElement(statuses),
            coverLetter: 'I am highly interested in this opportunity and believe my skills align well with the requirements.',
            appliedAt: new Date(Date.now() - getRandomInt(1, 30) * 24 * 60 * 60 * 1000)
        });
    }
}

// --- Main Seed Function ---
const seedAdditionalData = async () => {
    try {
        console.log('🌱 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('✅ Connected.\n');

        console.log('📊 Current Database State:');
        console.log(`   Users: ${await User.countDocuments()}`);
        console.log(`   Companies: ${await Company.countDocuments()}`);
        console.log(`   Internships: ${await Internship.countDocuments()}`);
        console.log(`   Applications: ${await Application.countDocuments()}\n`);

        let credentialLog = '';

        // Check if GENERATED_USERS.md exists and read it
        if (fs.existsSync(GENERATED_USERS_FILE)) {
            credentialLog = fs.readFileSync(GENERATED_USERS_FILE, 'utf-8');
            credentialLog += '\n\n## Additional Seed Data (Additive)\n\n| Role | Name | Email | Password |\n|---|---|---|---|\n';
        } else {
            credentialLog = '# Generated User Credentials\n\n## Additional Seed Data\n\n| Role | Name | Email | Password |\n|---|---|---|---|\n';
        }

        // 1. Create Additional Students
        console.log('👤 Creating Additional Students...');
        const newStudents = [];
        for (let i = 0; i < studentNames.length; i++) {
            const email = `seed.student${i + 1}@test.com`;
            const student = await createStudentIfNotExists(email, studentNames[i]);
            newStudents.push(student);
            credentialLog += `| Student | ${studentNames[i]} | ${email} | password123 |\n`;
        }

        // 2. Create Additional Companies
        console.log('\n🏢 Creating Additional Companies...');
        const newCompanies = [];
        for (let i = 0; i < companyNames.length; i++) {
            const email = `seed.company${i + 1}@test.com`;
            const companyData = await createCompanyIfNotExists(email, companyNames[i]);
            if (companyData.profile) {
                newCompanies.push(companyData);
                credentialLog += `| Company | ${companyNames[i]} | ${email} | password123 |\n`;
            }
        }

        // 3. Create Internships for New Companies
        console.log('\n💼 Creating Internships...');
        const allNewInternships: any[] = [];
        for (const companyData of newCompanies) {
            if (companyData.profile) {
                console.log(`  For ${companyData.profile.companyName}:`);
                const internships = await createInternshipsForCompany(companyData.profile, getRandomInt(2, 4));
                allNewInternships.push(...internships);
            }
        }

        // 4. Create Applications (link students to internships)
        console.log('\n📝 Creating Applications...');
        const allStudents = await User.find({ role: 'student' });
        for (const internship of allNewInternships.slice(0, 10)) { // Limit to first 10 internships
            await createApplicationsForInternship(internship._id.toString(), allStudents, getRandomInt(2, 5));
        }

        // 5. Create Notifications for new data
        console.log('\n🔔 Creating Notifications...');
        if (newStudents.length > 0 && allNewInternships.length > 0) {
            await Notification.create({
                userId: newStudents[0]._id,
                title: 'Welcome to AcadIntern!',
                message: 'Start exploring internships that match your profile.',
                type: 'general',
                read: false
            });
        }

        // 6. Update credentials file
        fs.writeFileSync(GENERATED_USERS_FILE, credentialLog);
        console.log(`\n📄 Credentials updated in: ${GENERATED_USERS_FILE}`);

        // Final stats
        console.log('\n📊 Final Database State:');
        console.log(`   Users: ${await User.countDocuments()}`);
        console.log(`   Companies: ${await Company.countDocuments()}`);
        console.log(`   Internships: ${await Internship.countDocuments()}`);
        console.log(`   Applications: ${await Application.countDocuments()}`);

        console.log('\n✅ Additive Seeding Complete! Existing data preserved.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
};

seedAdditionalData();
