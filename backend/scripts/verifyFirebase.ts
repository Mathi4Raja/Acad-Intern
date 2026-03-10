import 'dotenv/config';
import { sendPushNotificationToUser } from '../utils/pushNotificationService';
import mongoose from 'mongoose';
import connectDB from '../config/db';

async function testFirebase() {
    console.log('🧪 Testing Firebase push end-to-end...');

    try {
        await connectDB();

        const userId = process.env.TEST_PUSH_USER_ID;
        if (!userId) {
            console.error('❌ Set TEST_PUSH_USER_ID in backend/.env');
            return;
        }

        await sendPushNotificationToUser(userId, {
            title: 'Test Push',
            body: 'Push pipeline test from verifyFirebase.ts'
        });

        console.log('✅ Push request sent. Check server logs for send results.');
    } catch (error) {
        console.error('❌ Firebase push test failed:', error);
    }
}

testFirebase().then(() => process.exit(0));
