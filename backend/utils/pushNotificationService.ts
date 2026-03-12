import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import MobileDevice from '../models/MobileDevice';

interface PushNotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
}

let firebaseAppInitialized = false;

const getFirebaseAdmin = (): any | null => {
    try {
        // Loaded dynamically so the backend still works if firebase-admin
        // is not installed in local/test environments.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require('firebase-admin');
    } catch (error) {
        return null;
    }
};

const getServiceAccount = (): Record<string, unknown> | null => {
    // 1. Try reading from a physical file first (most reliable)
    try {
        const filePath = path.resolve(process.cwd(), 'service-account.json');
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(raw);
        }
    } catch (error) {
        console.warn('Push: service-account.json found but could not be parsed:', error);
    }

    // 2. Fallback to full JSON in env var
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim().replace(/^["']|["']$/g, '');
            const parsed = JSON.parse(rawJson);

            if (parsed.private_key) {
                parsed.private_key = parsed.private_key
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '\r')
                    .replace(/\r\n/g, '\n')
                    .replace(/\r/g, '\n');

                console.log(`Push: Private key parsed from JSON. Length: ${parsed.private_key.length}`);
                console.log(`Push: Client Email: ${parsed.client_email}`);
                console.log(`Push: Project ID: ${parsed.project_id}`);
                console.log(`Push: Private key starts with: ${parsed.private_key.substring(0, 30)}`);
                console.log(`Push: Private key ends with: ${parsed.private_key.substring(parsed.private_key.length - 30)}`);
            }

            return parsed;
        } catch (error) {
            console.error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', error);
            return null;
        }
    }

    if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
    ) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY.trim();

        // Remove surrounding quotes and handle escaping
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.substring(1, privateKey.length - 1);
        } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
            privateKey = privateKey.substring(1, privateKey.length - 1);
        }

        // Standardize newlines: replace \r\n, \r, and literal \n sequences with actual newlines
        privateKey = privateKey
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n');

        return {
            projectId: process.env.FIREBASE_PROJECT_ID.trim().replace(/^["']|["']$/g, ''),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL.trim().replace(/^["']|["']$/g, ''),
            privateKey
        };
    }

    return null;
};

const ensureFirebaseApp = (): any | null => {
    const firebaseAdmin = getFirebaseAdmin();
    if (!firebaseAdmin) {
        console.warn('Push: firebase-admin not available');
        return null;
    }

    if (firebaseAppInitialized) {
        return firebaseAdmin;
    }

    const serviceAccount = getServiceAccount();
    if (!serviceAccount) {
        console.warn('Push: missing Firebase service account env vars');
        return null;
    }

    try {
        if (!firebaseAdmin.apps.length) {
            firebaseAdmin.initializeApp({
                credential: firebaseAdmin.credential.cert(serviceAccount)
            });
        }
        firebaseAppInitialized = true;
        console.log('Push: Firebase Admin initialized');
        return firebaseAdmin;
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        return null;
    }
};

export const sendPushNotificationToUser = async (
    userId: string,
    payload: PushNotificationPayload
): Promise<void> => {
    const firebaseAdmin = ensureFirebaseApp();
    if (!firebaseAdmin) {
        console.warn('Push: skipped send, Firebase Admin not initialized');
        return;
    }

    // Ensure userId is an ObjectId if it's a valid hex string
    const queryUserId = mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : userId;

    const devices = await MobileDevice.find({
        userId: queryUserId,
        isActive: true
    }).select('fcmToken');

    if (!devices.length) {
        console.warn(`Push: no active devices for user ${userId} (queryUserId: ${queryUserId})`);

        // Debug: list all devices
        const allDevices = await MobileDevice.find({}).select('userId isActive');
        console.log(`Push: Total devices in collection: ${allDevices.length}`);
        if (allDevices.length > 0) {
            console.log(`Push: All device user IDs and status: ${allDevices.map(a => `${a.userId?.toString()}(${a.isActive})`).join(', ')}`);
        }

        const allActive = await MobileDevice.find({ isActive: true }).select('userId');
        console.log(`Push: Total active devices in DB: ${allActive.length}`);
        if (allActive.length > 0) {
            console.log(`Push: Active user IDs: ${allActive.map(a => a.userId.toString()).join(', ')}`);
        }

        return;
    }

    const tokens = devices.map((device) => device.fcmToken).filter(Boolean);
    if (!tokens.length) {
        console.warn(`Push: empty tokens for user ${userId}`);
        return;
    }

    try {
        const response = await firebaseAdmin.messaging().sendEachForMulticast({
            tokens,
            notification: {
                title: payload.title,
                body: payload.body
            },
            data: payload.data || {}
        });
        console.log(
            `Push: sent to ${tokens.length} token(s), success=${response.successCount}, failure=${response.failureCount}`
        );

        response.responses.forEach((resp: any, idx: number) => {
            if (!resp.success) {
                console.error(`Push: Token ${idx} failed with error:`, resp.error);
            }
        });

        const invalidTokens = response.responses
            .map((item: any, index: number) => (item.success ? null : tokens[index]))
            .filter(Boolean);

        if (invalidTokens.length) {
            console.warn(`Push: invalid tokens=${invalidTokens.length}`);
            await MobileDevice.updateMany(
                { fcmToken: { $in: invalidTokens } },
                { $set: { isActive: false } }
            );
        }
    } catch (error) {
        console.error('Failed to send push notification:', error);
    }
};
