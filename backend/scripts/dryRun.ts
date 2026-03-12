import 'dotenv/config';
import * as admin from 'firebase-admin';

async function dryRun() {
    console.log('🧪 Starting deep diagnostic for Firebase...');

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.error('❌ Missing Firebase environment variables');
        process.exit(1);
    }

    // Clean up private key
    privateKey = privateKey.replace(/\\n/g, '\n');
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
    }

    console.log(`- Project ID: ${projectId}`);
    console.log(`- Client Email: ${clientEmail}`);

    try {
        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey
                })
            });
        }

        console.log('✅ SDK Initialized');

        // Test 1: Try to list users (basic auth test)
        try {
            const listUsersResult = await admin.auth().listUsers(1);
            console.log('✅ Auth Test: Successfully connected to Auth API');
        } catch (e: any) {
            console.warn('⚠️ Auth Test Failed:', e.message);
        }

        // Test 2: Try to send dummy message
        const dummyToken = 'egz-JyNyTdGAR3Nb0Hpv76:APA91bFxW_U3GfQg3k_qD68eiL1qHoMtOtEDQLwHS1zNJIpU2zvhnUYdmWO5I9Fdi9DnBXug5eICbdEoAAPxqh_14esNvyAGsY5p2Vn3wtvCnwfyNRX3TDw';
        const message = {
            token: dummyToken,
            notification: {
                title: 'Diagnostic Test',
                body: 'Checking permissions'
            }
        };

        try {
            console.log('📡 Attempting FCM Send (Dry Run)...');
            const response = await admin.messaging().send(message, true);
            console.log('✅ FCM Send Test: Success!');
            console.log('Response:', response);
        } catch (e: any) {
            console.error('❌ FCM Send Test Failed:', e.message);
            console.log('\nPotential causes:');
            console.log('1. "Firebase Cloud Messaging API" is not enabled in the Cloud Console.');
            console.log('2. Service account lacks "Firebase Cloud Messaging Admin" role (User says it has it).');
            console.log('3. Token belongs to a different Firebase project.');
        }

    } catch (error: any) {
        console.error('❌ SDK Error:', error.message || error);
    }
}

dryRun().then(() => process.exit(0));
