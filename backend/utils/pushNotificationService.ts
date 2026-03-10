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
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
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
        return {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
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

    const devices = await MobileDevice.find({
        userId,
        isActive: true
    }).select('fcmToken');

    if (!devices.length) {
        console.warn(`Push: no active devices for user ${userId}`);
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
