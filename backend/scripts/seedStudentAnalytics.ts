import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import Internship from '../models/Internship';
import Application from '../models/Application';
import ProfileView from '../models/ProfileView';

async function seedStudentAnalytics() {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // 1. Get the main test student
        // 1. Get the main test student (Fallback to first student found if specific one missing)
        let student = await User.findOne({ email: 'student1@example.com' });

        if (!student) {
            console.log('⚠️ Specific test user not found, falling back to first available student...');
            student = await User.findOne({ role: 'student' });
        }

        if (!student) {
            console.error('❌ No student user found in database. Please register a student first.');
            process.exit(1);
        }
        console.log(`👤 Seeding analytics for: ${student.email}`);

        // 2. Clear existing stats for this student
        await ProfileView.deleteMany({ profileOwnerId: student._id });

        // 3. Seed Profile Views (Last 30 days)
        console.log('👀 Seeding profile views...');
        const companyUsers = await User.find({ role: 'company' }).limit(10);

        const viewsToCreate = [];
        const endDate = new Date();
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Generate random daily views pattern for last 60 days
        for (let d = 0; d < 60; d++) {
            const date = new Date(sixtyDaysAgo);
            date.setDate(date.getDate() + d);

            // Random number of views per day
            // Days 0-29 (Old data): Low views (0-3) to ensure meaningful growth later
            // Days 30-59 (New data): High views (20-50) to force >100% trend
            let dailyViews;
            if (d < 30) {
                dailyViews = Math.floor(Math.random() * 3); // previous month (low)
            } else {
                dailyViews = Math.floor(Math.random() * 30) + 20; // current month (HUGE spike)
            }

            for (let v = 0; v < dailyViews; v++) {
                // Pick random viewer
                const viewer = companyUsers[Math.floor(Math.random() * companyUsers.length)];

                // Add some randomness to time within the day
                const viewTime = new Date(date);
                viewTime.setHours(9 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

                viewsToCreate.push({
                    viewerId: viewer._id,
                    profileOwnerId: student._id,
                    viewerRole: 'company',
                    viewType: 'profile_view',
                    viewedAt: viewTime
                });
            }

            // Seed Search Appearances (usually higher than clicks/views)
            const dailyAppearances = Math.floor(Math.random() * 40) + 10;
            for (let a = 0; a < dailyAppearances; a++) {
                const viewTime = new Date(date);
                viewTime.setHours(9 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

                viewsToCreate.push({
                    viewerId: companyUsers[Math.floor(Math.random() * companyUsers.length)]._id, // Who searched
                    profileOwnerId: student._id,
                    viewerRole: 'company',
                    viewType: 'search_appearance',
                    viewedAt: viewTime
                });
            }
        }
        await ProfileView.insertMany(viewsToCreate);
        console.log(`✅ Created ${viewsToCreate.length} analytics records`);

        // 4. Update Student Skills to match some demand
        console.log('🛠 Updating student skills...');
        // Get popular skills from internships
        const internships = await Internship.find({ status: 'active' }).limit(20);
        const allSkills = new Set<string>();
        internships.forEach(i => i.skillsRequired.forEach(s => allSkills.add(s)));
        const marketSkills = Array.from(allSkills).slice(0, 8); // Top 8 market skills

        // Give student a mix of these skills (good match)
        const studentSkills = marketSkills.slice(0, 5).concat(['ObscureLang']); // 5 matches, 1 miss
        await StudentProfile.findOneAndUpdate(
            { userId: student._id },
            {
                skills: studentSkills,
                bio: "Passionate developer with strong skills in web technologies.",
                // Removed fake resumeUrl - it fails validation
                github: "https://github.com/student",
                linkedIn: "https://linkedin.com/in/student"
            }

        );
        console.log('✅ Updated student profile with relevant skills');

        console.log('\n✨ Analytics data seeding completed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
}

seedStudentAnalytics();
