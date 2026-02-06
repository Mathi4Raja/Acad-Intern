import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';
import Company from '../models/Company';
import StudentProfile from '../models/StudentProfile';
import Internship from '../models/Internship';
import Application from '../models/Application';
import connectDB from '../config/db';

const populateInternships = async () => {
    console.log('🌱 Populating Internships & Applications...');

    try {
        await connectDB();

        // Find Company
        const companyUser = await User.findOne({ email: 'company@test.com' });
        if (!companyUser) throw new Error('Company user not found. Run seedData.ts first.');

        const companyProfile = await Company.findOne({ userId: companyUser._id });
        if (!companyProfile) throw new Error('Company profile not found.');

        // Find Student
        const studentUser = await User.findOne({ email: 'student@test.com' });
        if (!studentUser) throw new Error('Student user not found.');

        // Create 3 Internships
        const internshipsData = [
            {
                title: 'Full Stack Developer Intern',
                description: 'Join our engineering team to build scalable web applications using MERN stack.',
                industry: 'Technology',
                skillsRequired: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
                durationWeeks: 12,
                stipend: 15000,
                location: 'Remote',
                mode: 'remote',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                status: 'active'
            },
            {
                title: 'Data Science Intern',
                description: 'Work on analyzing large datasets and building predictive models.',
                industry: 'Data Science',
                skillsRequired: ['Python', 'Pandas', 'scikit-learn', 'SQL'],
                durationWeeks: 10,
                stipend: 20000,
                location: 'New York, NY',
                mode: 'onsite',
                deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                status: 'active'
            },
            {
                title: 'UI/UX Designer Intern',
                description: 'Design intuitive and beautiful user interfaces for our products.',
                industry: 'Design',
                skillsRequired: ['Figma', 'Adobe XD', 'Prototyping'],
                durationWeeks: 8,
                stipend: 12000,
                location: 'San Francisco, CA',
                mode: 'hybrid',
                deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                status: 'active'
            }
        ];

        // Create 2 Additional Students for diverse applicants
        const student2 = await User.create({ name: 'Alice Smith', email: 'alice@test.com', password_hash: 'password123', role: 'student', isVerified: true, status: 'active' });
        await StudentProfile.create({ userId: student2._id, university: 'Stanford', skills: ['Python', 'AI'], bio: 'AI Researcher' });

        const student3 = await User.create({ name: 'Bob Jones', email: 'bob@test.com', password_hash: 'password123', role: 'student', isVerified: true, status: 'active' });
        await StudentProfile.create({ userId: student3._id, university: 'MIT', skills: ['UX', 'Figma'], bio: 'Designer' });

        const students = [studentUser, student2, student3];

        console.log('📝 Creating Internships...');
        const createdInternships = [];

        for (const data of internshipsData) {
            const internship = await Internship.create({
                companyId: companyProfile._id,
                ...data,
                postedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000) // Random posted date within last 10 days
            });
            createdInternships.push(internship);
            console.log(`   + Created: ${internship.title}`);
        }

        // Apply with diverse statuses
        console.log('📝 Creating Applications...');
        const statuses = ['pending', 'shortlisted', 'rejected', 'accepted', 'pending', 'shortlisted'];

        for (const internship of createdInternships) {
            for (const student of students) {
                // Randomize status
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                const appliedAt = new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000);

                await Application.create({
                    studentId: student._id,
                    internshipId: internship._id,
                    status: status,
                    notes: `I am interested in this ${internship.title} role!`,
                    appliedAt: appliedAt
                });
                console.log(`   + Applied: ${student.name} -> ${internship.title} [${status}]`);
            }
        }

        console.log('\n✨ Internships & Applications successfully populated!');

    } catch (error) {
        console.error('❌ Population failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

populateInternships();
