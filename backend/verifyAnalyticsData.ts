
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db';
import ProfileView from './models/ProfileView';

async function verifyAnalytics() {
    try {
        await connectDB();

        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(now.getDate() - 60);

        const currentCount = await ProfileView.countDocuments({
            viewedAt: { $gte: thirtyDaysAgo }
        });

        const previousCount = await ProfileView.countDocuments({
            viewedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
        });

        console.log(`Current Period (Last 30 days): ${currentCount} records`);
        console.log(`Previous Period (30-60 days ago): ${previousCount} records`);

        if (previousCount > 0) {
            console.log('✅ SUCCESS: Historical data exists for trend calculation.');
        } else {
            console.log('❌ FAILURE: No historical data found.');
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

verifyAnalytics();
