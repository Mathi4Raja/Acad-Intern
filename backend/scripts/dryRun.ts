import 'dotenv/config';
import * as admin from 'firebase-admin';

async function dryRun() {
    console.log('🧪 Starting dry run with Firebase credentials...');

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^"|"$/g, '');

    if (!projectId || !clientEmail || !privateKey) {
        console.error('❌ Missing Firebase environment variables');
        process.exit(1);
    }

    console.log(`- Project ID: ${projectId}`);
    console.log(`- Client Email: ${clientEmail}`);
    console.log(`- Private Key length: ${privateKey.length}`);

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

        const messaging = admin.messaging();

        // We use a dummy token for dry-run
        // Firebase Cloud Messaging dry_run doesn't check token validity strictly
        // but it checks authentication and authorization.
        const dummyToken = 'egz-JyNyTdGAR3Nb0Hpv76:APA91bFxW_U3GfQg3k_qD68eiL1qHoMtOtEDQLwHS1zNJIpU2zvhnUYdmWO5I9Fdi9DnBXug5eICbdEoAAPxqh_14esNvyAGsY5p2Vn3wtvCnwfyNRX3TDw';

        const message = {
            token: dummyToken,
            notification: {
                title: 'Dry Run Test',
                body: 'This is a test notification'
            }
        };

        const response = await messaging.send(message, true);
        console.log('✅ Dry run success! Credentials and permissions are valid.');
        console.log('Firebase Response:', response);
    } catch (error: any) {
        console.error('❌ Dry run failed:', error.message || error);

        if (error.code === 'messaging/permission-denied') {
            console.log('\n💡 ADVICE: Grant the "Firebase Cloud Messaging Admin" role to this service account in the Google Cloud Console.');
        }
    }
}

dryRun().then(() => process.exit(0));
