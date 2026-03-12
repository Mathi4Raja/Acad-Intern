import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';
import MobileDevice from '../models/MobileDevice';
import User from '../models/User';

async function listDevices() {
    console.log('🔍 Searching for active mobile devices...');

    try {
        await connectDB();

        const email = process.argv[2];
        const query: any = {};

        if (email) {
            const user = await User.findOne({ email });
            if (user) {
                query.userId = user._id;
                console.log(`Filtering for user: ${email} (${user._id})`);
            } else {
                console.log(`User not found: ${email}. Showing all devices.`);
            }
        }

        const devices = await MobileDevice.find(query).populate('userId', 'email');

        console.log(`Found ${devices.length} device(s)`);

        devices.forEach((d: any, i: number) => {
            console.log(`\nDevice #${i + 1}:`);
            console.log(`- ID: ${d._id}`);
            console.log(`- Platform: ${d.platform}`);
            console.log(`- Token: ${d.fcmToken.substring(0, 10)}...`);
            console.log(`- Active: ${d.isActive}`);
            console.log(`- User: ${d.userId?.email || 'N/A'} (${d.userId?._id || 'N/A'})`);
            console.log(`- Last Seen: ${d.lastSeenAt}`);
        });

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error fetching devices:', error);
        process.exit(1);
    }
}

listDevices();
