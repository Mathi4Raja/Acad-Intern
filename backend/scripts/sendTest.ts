import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';
import { sendPushNotificationToUser } from '../utils/pushNotificationService';
import User from '../models/User';

async function sendTest(email: string) {
    if (!email) {
        console.error('❌ Please provide a user email as an argument.');
        process.exit(1);
    }

    try {
        await connectDB();
        const user = await User.findOne({ email });

        if (!user) {
            console.error(`❌ User with email ${email} not found.`);
            return;
        }

        console.log(`🚀 Sending test notification to ${user.name} (${user._id})...`);

        await sendPushNotificationToUser(user._id.toString(), {
            title: 'Test Notification',
            body: 'This is a real push notification from the backend! 🔥',
            data: {
                route: '/notifications',
                type: 'test'
            }
        });

        console.log('✅ Request sent to Firebase. Check your phone!');
        console.log('Note: If the user has no registered devices, nothing will happen.');

    } catch (error) {
        console.error('❌ Error sending notification:', error);
    } finally {
        await mongoose.connection.close();
    }
}

const targetEmail = process.argv[2];
sendTest(targetEmail).then(() => process.exit(0));
