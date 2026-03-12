
import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

async function verify() {
    const rawJson = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim().replace(/^["']|["']$/g, '');
    try {
        const parsed = JSON.parse(rawJson);
        if (parsed.private_key) {
            const header = "-----BEGIN PRIVATE KEY-----";
            const footer = "-----END PRIVATE KEY-----";
            let raw = parsed.private_key;

            // Remove headers/footers if present
            raw = raw.replace(header, '').replace(footer, '');

            // Aggressively remove all whitespace and escapes
            raw = raw.replace(/\\n/g, '').replace(/\\r/g, '').replace(/\s/g, '');

            // Rebuild with exact 64-character lines (optional but cleaner)
            // or just one big block (Node.js/Google usually accepts this)
            parsed.private_key = `${header}\n${raw}\n${footer}\n`;
        }

        const auth = new GoogleAuth({
            credentials: {
                client_email: parsed.client_email,
                private_key: parsed.private_key,
                project_id: parsed.project_id
            },
            scopes: ['https://www.googleapis.com/auth/firebase.messaging']
        });

        console.log('Attempt 1: Authenticating with full credentials...');
        const client = await auth.getClient();
        try {
            const token = await client.getAccessToken();
            if (token && token.token) {
                console.log('✅ Success! Token fetched (Attempt 1).');
            }
        } catch (e: any) {
            console.log('❌ Attempt 1 failed:', e.message);
        }

        const auth2 = new GoogleAuth({
            credentials: {
                client_email: parsed.client_email,
                private_key: parsed.private_key
            } as any,
            scopes: ['https://www.googleapis.com/auth/firebase.messaging']
        });

        console.log('Attempt 2: Authenticating with ONLY email and private_key...');
        const client2 = await auth2.getClient();
        try {
            const token2 = await client2.getAccessToken();
            if (token2 && token2.token) {
                console.log('✅ Success! Token fetched (Attempt 2).');
            }
        } catch (e: any) {
            console.log('❌ Attempt 2 failed:', e.message);
        }
    } catch (error: any) {
        console.log('❌ Auth failed:', error.message);
        if (error.response && error.response.data) {
            console.log('Raw response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

verify();
