
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const rawJson = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim().replace(/^["']|["']$/g, '');
try {
    const parsed = JSON.parse(rawJson);
    let key = parsed.private_key;
    if (key) {
        key = key
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n');

        console.log('Testing signature locally...');
        const signer = crypto.createSign('RSA-SHA256');
        signer.update('test data');
        const signature = signer.sign(key, 'base64');
        console.log('✅ Local signature successful! Length:', signature.length);
        console.log('Signature snippet:', signature.substring(0, 30));
    } else {
        console.log('❌ Private key not found in JSON');
    }
} catch (error: any) {
    console.log('❌ Local signature failed:', error.message);
    if (error.stack) console.log(error.stack);
}
