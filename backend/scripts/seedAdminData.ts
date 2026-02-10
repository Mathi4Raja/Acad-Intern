import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import Company from '../models/Company';
import Internship from '../models/Internship';
import Application from '../models/Application';
import Report from '../models/Report';
import SystemSetting from '../models/SystemSetting';

const STUDENTS_COUNT = 50;
const COMPANIES_COUNT = 15;
const INTERNSHIPS_PER_COMPANY = 3;

async function seedAdminData() {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🗑️  Clearing existing test data...');
        // Delete all users except the main admin if you want to preserve it, 
        // but for a clean "chart fill" usually better to wipe or ensure no duplicates.
        // Here we wipe everything for a fresh state as per user request context.
        await User.deleteMany({});
        await StudentProfile.deleteMany({});
        await Company.deleteMany({});
        await Internship.deleteMany({});
        await Application.deleteMany({});
        await Report.deleteMany({});

        // Create admin user
        console.log('👨‍💼 Creating admin user...');
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@acadintern.com',
            password_hash: 'admin123',
            role: 'admin',
            status: 'active',
            createdAt: new Date() // Admin created now
        });
        await adminUser.save();
        console.log('✅ Admin user created:', adminUser.email);

        // Helper to generate a random date within the last year
        const randomDate = (start: Date, end: Date) => {
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        };
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        // Create students
        console.log(`👨‍🎓 Creating ${STUDENTS_COUNT} student users...`);
        const students = [];
        const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Data Science', 'AI & ML'];
        const semesters = [4, 5, 6, 7, 8];
        const skillsPool = ['JavaScript', 'Python', 'React', 'Node.js', 'MongoDB', 'SQL', 'AWS', 'Docker', 'Java', 'C++', 'Figma', 'TypeScript'];
        const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'];

        for (let i = 1; i <= STUDENTS_COUNT; i++) {
            // Spread creation date to populate "User Growth" chart
            const userCreatedAt = randomDate(oneYearAgo, new Date());

            const studentUser = new User({
                name: `Student User ${i}`,
                email: `student${i}@example.com`,
                password_hash: 'password123',
                role: 'student',
                status: Math.random() > 0.1 ? 'active' : 'pending', // Mostly active
                createdAt: userCreatedAt
            });
            await studentUser.save();

            const profile = new StudentProfile({
                userId: studentUser._id,
                department: departments[Math.floor(Math.random() * departments.length)],
                semester: semesters[Math.floor(Math.random() * semesters.length)],
                resumeUrl: `https://r2.example.com/resumes/student${i}.pdf`,
                skills: skillsPool.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 5) + 2),
                hoursRequired: 150 + Math.random() * 150,
                cgpa: (6 + Math.random() * 4).toFixed(1), // 6.0 to 10.0
                linkedIn: `linkedin.com/in/student${i}`,
                github: `github.com/student${i}`,
                location: locations[Math.floor(Math.random() * locations.length)],
                createdAt: userCreatedAt
            });
            await profile.save();

            students.push(studentUser);
        }
        console.log(`✅ Created ${STUDENTS_COUNT} student users`);

        // Create companies
        console.log(`🏢 Creating ${COMPANIES_COUNT} company users...`);
        const companies = [];
        const companyNames = [
            'TechCorp Solutions', 'CloudWave Innovations', 'DataDrive Analytics', 'SecureNet Systems',
            'ByteForce Labs', 'InnovateTech Ventures', 'FutureStack AI', 'QuantumLeap Digital',
            'EcoSys Partners', 'FinTech Frontiers', 'HealthGuard Systems', 'EduLearn Interactive',
            'MediaStream Network', 'LogiChain Dynamics', 'AutoPilot Robotics'
        ];
        const industries = ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education', 'Media', 'Logistics'];

        for (let i = 0; i < COMPANIES_COUNT; i++) {
            const companyCreatedAt = randomDate(oneYearAgo, new Date());

            const companyUser = new User({
                name: companyNames[i % companyNames.length],
                email: `company${i + 1}@example.com`,
                password_hash: 'password123',
                role: 'company',
                status: 'active',
                createdAt: companyCreatedAt
            });
            await companyUser.save();

            const company = new Company({
                userId: companyUser._id,
                companyName: companyNames[i % companyNames.length],
                website: `https://company${i + 1}.com`,
                description: `Leading company in ${industries[i % industries.length]} sector`,
                verified: Math.random() > 0.3, // 70% verified
                status: 'active',
                cin: `CIN${String(i + 1).padStart(6, '0')}`,
                logo: `https://r2.example.com/logos/company${i + 1}.png`,
                location: locations[Math.floor(Math.random() * locations.length)],
                industry: industries[i % industries.length],
                companySize: ['50-100', '100-500', '500-1000', '1000-5000'][Math.floor(Math.random() * 4)],
                founded: 2020 - Math.floor(Math.random() * 10),
                about: `About ${companyNames[i % companyNames.length]}: We are a leading innovator.`,
                createdAt: companyCreatedAt
            });
            await company.save();

            companies.push({ user: companyUser, company });
        }
        console.log(`✅ Created ${COMPANIES_COUNT} company users`);

        // Create internships
        console.log(`💼 Creating internships...`);
        const internships = [];
        const internshipTitles = [
            'Frontend Developer Intern', 'Backend Developer Intern', 'Full Stack Developer Intern',
            'Data Science Intern', 'DevOps Engineer Intern', 'Product Manager Intern',
            'UX Designer Intern', 'Business Analyst Intern', 'Mobile App Developer', 'Cybersecurity Analyst'
        ];
        const modes = ['remote', 'onsite', 'hybrid'];

        let internshipCount = 0;
        for (const { company } of companies) {
            for (let j = 0; j < INTERNSHIPS_PER_COMPANY; j++) {
                // Determine status logic for charts
                const statuses = ['active', 'completed', 'in_progress', 'rejected'];
                const status = statuses[Math.floor(Math.random() * statuses.length)];

                const internship = new Internship({
                    companyId: company._id,
                    title: internshipTitles[internshipCount % internshipTitles.length],
                    description: `An exciting opportunity to work with our team and gain hands-on experience in ${internshipTitles[internshipCount % internshipTitles.length]}.`,
                    skillsRequired: skillsPool.sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3)),
                    durationWeeks: 8 + Math.floor(Math.random() * 12),
                    stipend: 10000 + Math.floor(Math.random() * 20000),
                    mode: modes[Math.floor(Math.random() * modes.length)],
                    openings: 1 + Math.floor(Math.random() * 5),
                    location: company.location,
                    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    status: status,
                    createdAt: randomDate(company.createdAt || new Date(), new Date())
                });
                await internship.save();
                internships.push(internship);
                internshipCount++;
            }
        }
        console.log(`✅ Created ${internships.length} internships`);

        // Create applications
        console.log(`📋 Creating applications...`);
        let applicationCount = 0;
        const appStatuses = ['pending', 'reviewed', 'shortlisted', 'interview_scheduled', 'accepted', 'rejected'];

        for (const student of students) {
            // Each student applies to 3-8 internships
            const numApplications = 3 + Math.floor(Math.random() * 6);
            const shuffledInternships = [...internships].sort(() => 0.5 - Math.random());
            const selectedInternships = shuffledInternships.slice(0, numApplications);

            for (const internship of selectedInternships) {
                // Application date must be after student join and internship post
                const minDate = new Date(Math.max(student.createdAt.getTime(), internship.createdAt.getTime()));
                const appliedAt = randomDate(minDate, new Date());

                const application = new Application({
                    internshipId: internship._id,
                    studentId: student._id,
                    status: appStatuses[Math.floor(Math.random() * appStatuses.length)],
                    coverLetter: 'I am very interested in this internship opportunity and believe I am a great fit.',
                    appliedAt: appliedAt,
                    createdAt: appliedAt
                });
                await application.save();
                applicationCount++;
            }
        }
        console.log(`✅ Created ${applicationCount} applications`);

        // Create reports
        console.log(`⚠️  Creating reports...`);
        const reportReasons = [
            'Inappropriate internship description', 'Misleading company information',
            'Fraudulent posting', 'Harassment on messaging', 'Unprofessional conduct'
        ];
        const reportStatuses = ['open', 'under_review', 'resolved', 'dismissed'];
        const reportPriorities = ['low', 'medium', 'high'];

        for (let i = 0; i < 12; i++) {
            const internship = internships[Math.floor(Math.random() * internships.length)];
            const reporter = students[Math.floor(Math.random() * students.length)];

            const report = new Report({
                internshipId: internship._id,
                reporterId: reporter._id,
                reason: reportReasons[Math.floor(Math.random() * reportReasons.length)],
                status: reportStatuses[Math.floor(Math.random() * reportStatuses.length)],
                priority: reportPriorities[Math.floor(Math.random() * reportPriorities.length)],
                createdAt: randomDate(oneYearAgo, new Date())
            });
            await report.save();
        }
        console.log(`✅ Created 12 reports`);

        // Create system settings
        console.log(`⚙️  Creating system settings...`);
        const defaultSettings = [
            { key: 'siteName', value: 'AcadIntern', group: 'general' },
            { key: 'siteDescription', value: 'Student internship platform', group: 'general' },
            { key: 'maintenanceMode', value: 'false', group: 'general' },
            { key: 'requireEmailVerification', value: 'true', group: 'security' },
            { key: 'allowResumeUpload', value: 'true', group: 'students' },
            { key: 'maxApplicationsPerDay', value: '30', group: 'students' },
            { key: 'timezone', value: 'Asia/Kolkata', group: 'security' },
            { key: 'maxResumeSize', value: '5', group: 'files' },
            { key: 'autoBackup', value: 'true', group: 'database' },
            { key: 'backupFrequency', value: 'daily', group: 'database' },
            { key: 'autoApproveCompanies', value: 'true', group: 'enterprise' },
            { key: 'requireCompanyVerification', value: 'true', group: 'enterprise' },
            { key: 'maxActiveInternshipListings', value: '20', group: 'enterprise' }
        ];

        for (const setting of defaultSettings) {
            await SystemSetting.findOneAndUpdate(
                { key: setting.key },
                { ...setting, updatedAt: new Date() },
                { upsert: true, new: true }
            );
        }
        console.log(`✅ Created system settings`);

        console.log('\n✨ Enhanced Admin data seeding completed successfully!');
        console.log('\n🔐 Admin Credentials:');
        console.log('   Email: admin@acadintern.com');
        console.log('   Password: admin123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    seedAdminData();
}

export default seedAdminData;
