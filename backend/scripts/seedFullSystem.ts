import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Import Models
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import Company from '../models/Company';
import Internship from '../models/Internship';
import Application from '../models/Application';
import Message from '../models/Message';
import Notification from '../models/Notification';
import Report from '../models/Report';

dotenv.config();

const GENERATED_USERS_FILE = path.join(__dirname, '../../others/GENERATED_USERS.md');

// --- Helper Functions ---

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubset = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const skillList = ['React', 'Node.js', 'Python', 'Java', 'C++', 'AWS', 'Docker', 'Figma', 'MongoDB', 'SQL'];
const locations = ['Bangalore', 'Mumbai', 'Delhi', 'Remote', 'Hyderabad', 'Pune', 'Chennai'];

// --- Data Generators ---

async function createStudent(email: string, name: string, isMain: boolean = false) {
    // const hashedPassword = await bcrypt.hash('password123', 10);

    // Check if user exists (to prevent dupes if rerunning without clean)
    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({
            name,
            email,
            password_hash: 'password123',
            role: 'student',
            isVerified: true,
            status: 'active'
        });
    }

    // Create Profile
    let profile = await StudentProfile.findOne({ userId: user._id });
    if (!profile) {
        profile = await StudentProfile.create({
            userId: user._id,
            bio: isMain ? "Motivated CS student with a passion for full-stack development." : "Aspiring developer looking for internships.",
            skills: isMain ? ['React', 'Node.js', 'TypeScript', 'MongoDB'] : getRandomSubset(skillList, 3),
            resumeUrl: isMain ? "https://example.com/resume.pdf" : undefined,
            completenessScore: isMain ? 100 : 70
        });

        await StudentProfile.findByIdAndUpdate(profile._id, {
            department: "Computer Science",
            location: "Bangalore"
        });
    }
    return user;
}

async function createCompany(email: string, name: string, isMain: boolean = false) {
    // const hashedPassword = await bcrypt.hash('password123', 10);

    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({
            name,
            email,
            password_hash: 'password123',
            role: 'company',
            isVerified: true,  // Assume verified for happy path
            status: 'active'
        });
    }

    let profile = await Company.findOne({ userId: user._id });
    if (!profile) {
        profile = await Company.create({
            userId: user._id,
            companyName: name,
            description: isMain ? "Leading tech solutions provider." : `Innovative company in ${getRandomElement(['Fintech', 'Edtech', 'Healthtech'])}.`,
            website: `https://${name.replace(/\s+/g, '').toLowerCase()}.com`,
            location: isMain ? 'Bangalore' : getRandomElement(locations),
            industry: 'Technology',
            companySize: '50-200',
            logo: isMain ? undefined : undefined, // Could add placeholder URLs here
            verified: true // Important for them to post internships
        });
    }
    return { user, profile };
}

async function createAdmin(email: string) {
    // const hashedPassword = await bcrypt.hash('password123', 10);

    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({
            name: 'System Admin',
            email,
            password_hash: 'password123',
            role: 'admin',
            isVerified: true,
            status: 'active'
        });
    }
    return user;
}

// --- Main Seed Function ---

const seedFullSystem = async () => {
    try {
        console.log('🌱 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('✅ Connected.');

        // 1. Clear Data (Optional: Comment out to append)
        console.log('🧹 Clearing existing seed data...');
        // We will wipe everything to verify the state clean
        await Promise.all([
            User.deleteMany({}),
            StudentProfile.deleteMany({}),
            Company.deleteMany({}),
            Internship.deleteMany({}),
            Application.deleteMany({}),
            Message.deleteMany({}),
            Notification.deleteMany({}),
            Report.deleteMany({})
        ]);
        console.log('✨ Database cleared.');

        let credentialLog = '# Generated User Credentials\n\n| Role | Name | Email | Password | Notes |\n|---|---|---|---|---|\n';

        // 2. Create Main Users
        console.log('👤 Creating Main Users...');
        const mainStudent = await createStudent('student@test.com', 'Test Student', true);
        const mainCompanyData = await createCompany('company@test.com', 'TechCorp Solutions', true);
        const adminUser = await createAdmin('admin@test.com');

        credentialLog += `| Student | Test Student | student@test.com | password123 | **Main Tester** |\n`;
        credentialLog += `| Company | TechCorp Solutions | company@test.com | password123 | **Main Tester** |\n`;
        credentialLog += `| Admin | System Admin | admin@test.com | password123 | **Main Tester** |\n`;


        // 3. Create Extra Users
        console.log('👥 Creating Extra Users...');

        const extraStudents = [];
        for (let i = 1; i <= 15; i++) {
            const email = `student${i}@test.com`;
            const name = `Student ${i}`;
            const user = await createStudent(email, name);
            extraStudents.push(user);
            credentialLog += `| Student | ${name} | ${email} | password123 | Generated |\n`;
        }

        const extraCompanies = [];
        for (let i = 1; i <= 8; i++) {
            const email = `company${i}@test.com`;
            const name = `Company ${i} Inc`;
            const data = await createCompany(email, name);
            extraCompanies.push(data);
            credentialLog += `| Company | ${name} | ${email} | password123 | Generated |\n`;
        }


        // 4. Create Internships
        console.log('💼 Creating Internships...');

        // Main Company Internships
        const mainInternships = [];
        const mainInternshipTitles = [
            { title: 'Frontend Developer', stipend: 25000, type: 'remote', applicants: 15 }, // High volume
            { title: 'Data Analyst', stipend: 15000, type: 'hybrid', applicants: 2 }, // Low volume
            { title: 'HR Intern', stipend: 0, type: 'onsite', applicants: 0 }, // Zero applicants
            { title: 'Marketing Intern', stipend: 10000, type: 'remote', status: 'completed' }, // Closed
            { title: 'Legacy Intern', stipend: 5000, type: 'onsite', status: 'completed' }, // Closed
            { title: 'React Developer', stipend: 20000, type: 'remote', applicants: 5 },
            { title: 'Node.js Backend', stipend: 22000, type: 'remote', applicants: 3 },
            { title: 'UI/UX Designer', stipend: 18000, type: 'hybrid', applicants: 6 },
            { title: 'Product Manager', stipend: 30000, type: 'onsite', applicants: 4 },
            { title: 'Sales Intern', stipend: 12000, type: 'onsite', applicants: 1 },
            { title: 'Content Writer', stipend: 8000, type: 'remote', applicants: 2 },
            { title: 'Video Editor', stipend: 15000, type: 'hybrid', applicants: 3 },
        ];

        for (const job of mainInternshipTitles) {
            const internship = await Internship.create({
                companyId: mainCompanyData.profile._id, // Link to Profile ID
                title: job.title,
                description: `We are looking for a ${job.title} to join our team. This is a great opportunity to learn and grow.`,
                requirements: "Basic knowledge of the field. Good communication skills.",
                responsibilities: "Assist the team with daily tasks. Learn from observation.",
                location: mainCompanyData.profile.location,
                skillsRequired: getRandomSubset(skillList, 3),
                durationWeeks: 12,
                stipend: job.stipend,
                type: job.type || 'remote',
                status: (job.status as any) || 'active',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            });
            mainInternships.push({ ...job, _id: internship._id });
        }

        // Other Companies Internships (Populate Feed)
        const otherInternships = [];
        for (const companyData of extraCompanies) {
            for (let j = 0; j < 3; j++) { // 3 internships per extra company
                const internship = await Internship.create({
                    companyId: companyData.profile._id,
                    title: `${getRandomElement(['Python', 'Java', 'Marketing', 'Sales'])} Intern`,
                    description: "Join our dynamic team!",
                    requirements: "Hard worker.",
                    responsibilities: "Work hard.",
                    location: getRandomElement(locations),
                    skillsRequired: getRandomSubset(skillList, 2),
                    durationWeeks: getRandomInt(8, 24),
                    stipend: getRandomInt(5000, 30000),
                    type: getRandomElement(['remote', 'onsite', 'hybrid']),
                    status: 'active',
                    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                });
                otherInternships.push(internship);
            }
        }


        // 5. Create Applications
        console.log('📝 Creating Applications...');

        // Main Student Applications
        // 1. Applied (Pending)
        const mainApplication = await Application.create({
            internshipId: mainInternships[0]._id, // Frontend Dev
            studentId: mainStudent._id,
            status: 'pending',
            coverLetter: 'I am extremely interested in this Frontend Developer role and believe my React skills are a perfect match.',
            appliedAt: new Date()
        });

        // 2. Shortlisted
        await Application.create({
            internshipId: mainInternships[6]._id, // Node.js
            studentId: mainStudent._id,
            status: 'shortlisted',
            appliedAt: new Date(Date.now() - 86400000)
        });

        // 3. Assessment Completed
        await Application.create({
            internshipId: mainInternships[1]._id, // Data Analyst
            studentId: mainStudent._id,
            status: 'assessment_completed',
            appliedAt: new Date(Date.now() - 2 * 86400000)
        });

        // 4. Offer Received
        await Application.create({
            internshipId: mainInternships[7]._id, // UI/UX
            studentId: mainStudent._id, // Fixed typo from 'student'
            status: 'accepted',
            appliedAt: new Date(Date.now() - 5 * 86400000)
        });

        // 5. Rejected
        await Application.create({
            internshipId: mainInternships[2]._id, // HR Intern
            studentId: mainStudent._id,
            status: 'rejected',
            appliedAt: new Date(Date.now() - 10 * 86400000)
        });


        // Incoming Applications for Main Company
        // Fill up "Frontend Developer" with 15 random applicants
        const frontendInternshipId = mainInternships[0]._id;
        for (const student of extraStudents) {
            await Application.create({
                internshipId: frontendInternshipId,
                studentId: student._id,
                status: getRandomElement(['pending', 'shortlisted', 'assessment_completed', 'rejected']),
                appliedAt: new Date(Date.now() - getRandomInt(0, 10) * 86400000)
            });
        }


        // 6. Messages
        console.log('💬 Creating Messages...');
        // Conversation: Main Student <-> Main Company linked to mainApplication

        // 5 Messages from Student
        for (let i = 0; i < 5; i++) {
            await Message.create({
                applicationId: mainApplication._id,
                senderId: mainStudent._id,
                receiverId: mainCompanyData.user._id,
                content: `Here is message ${i + 1} regarding my application.`,
                attachments: [],
                status: 'seen',
                createdAt: new Date(Date.now() - (10 - i) * 60000)
            });
        }
        // 5 Messages from Company
        for (let i = 0; i < 5; i++) {
            await Message.create({
                applicationId: mainApplication._id,
                senderId: mainCompanyData.user._id,
                receiverId: mainStudent._id,
                content: `Thanks for reaching out! Response ${i + 1}.`,
                attachments: [],
                status: i < 3 ? 'seen' : 'sent',
                createdAt: new Date(Date.now() - (5 - i) * 60000)
            });
        }


        // 7. Notifications
        console.log('🔔 Creating Notifications...');
        await Notification.create({
            userId: mainStudent._id,
            title: "Application Shortlisted",
            message: "Your application for Node.js Backend has been shortlisted!",
            type: "status_update",
            payload: { relatedId: mainInternships[6]._id },
            read: false
        });

        await Notification.create({
            userId: mainCompanyData.user._id,
            title: "New Application",
            message: "Student 1 applied for Frontend Developer",
            type: "application",
            payload: { relatedId: frontendInternshipId },
            read: false
        });

        // 8. Reports
        console.log('🚩 Creating Reports...');
        await Report.create({
            reporterId: mainStudent._id,
            internshipId: otherInternships[0]._id,
            reason: 'Scam/Fake',
            status: 'open'
        });

        // 9. Write Credential Log
        fs.writeFileSync(GENERATED_USERS_FILE, credentialLog);
        console.log(`📄 Credentials logged to ${GENERATED_USERS_FILE}`);
        console.log('✅ Seeding Complete!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
};

seedFullSystem();
