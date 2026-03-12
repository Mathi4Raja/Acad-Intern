
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.argv[2] || '.env');
const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split('\n');
const targetLine = lines.find(l => l.includes('FIREBASE_SERVICE_ACCOUNT_JSON'));

if (!targetLine) {
    console.log('Line not found');
} else {
    console.log('Line length:', targetLine.length);
    const buffer = Buffer.from(targetLine, 'utf8');
    console.log('Bytes (hex):', buffer.toString('hex').match(/.{1,2}/g)?.join(' '));

    // Also try to simulate what pushNotificationService does
    dotenv.config({ path: envPath });
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '';
    console.log('Process.env value length:', raw.length);
    const rawBuf = Buffer.from(raw, 'utf8');
    console.log('Process.env bytes (hex):', rawBuf.toString('hex').match(/.{1,2}/g)?.join(' '));
}
