import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';
import MobileDevice from '../models/MobileDevice';

async function listDevices() {
    console.log('🔍 Searching for active mobile devices...');
    try {
        await connectDB();
        const devices = await MobileDevice.find({}).populate('userId', 'name email');

        if (devices.length === 0) {
            console.log('❌ No active devices found in the database.');
            console.log('Tip: Log in to the mobile app to register a device.');
        } else {
            console.log(`✅ Found ${devices.length} active device(s):`);
            devices.forEach((d: any, i) => {
                console.log(`[${i + 1}] User: ${d.userId?.name || 'Unknown'} (${d.userId?.email || 'No email'})`);
                console.log(`    Platform: ${d.platform}`);
                console.log(`    Token: ${d.fcmToken.substring(0, 10)}...`);
                console.log(`    User ID: ${d.userId?._id || 'N/A'}`);
                console.log('---');
            });
        }
    } catch (error) {
        console.error('❌ Error fetching devices:', error);
    } finally {
        await mongoose.connection.close();
    }
}

listDevices();
