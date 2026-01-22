import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import path from 'path';

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'acadintern';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''; // Your R2 public domain

// Initialize S3 Client for R2
const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

// Check if R2 is configured
export const isR2Configured = (): boolean => {
    return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
};

// Upload result interface (matching Cloudinary's format for compatibility)
export interface UploadResult {
    secure_url: string;
    public_id: string;
    format: string;
    bytes: number;
}

/**
 * Upload a file buffer to Cloudflare R2
 */
export const uploadToR2 = async (
    buffer: Buffer,
    originalFilename: string,
    mimetype: string
): Promise<UploadResult> => {
    // Generate unique filename
    const ext = path.extname(originalFilename).toLowerCase();
    const uniqueId = randomUUID();
    const key = `acadintern/resumes/${uniqueId}${ext}`;

    // Upload to R2
    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
    });

    await r2Client.send(command);

    // Construct public URL
    const publicUrl = R2_PUBLIC_URL
        ? `${R2_PUBLIC_URL}/${key}`
        : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return {
        secure_url: publicUrl,
        public_id: key,
        format: ext.replace('.', ''),
        bytes: buffer.length,
    };
};

/**
 * Delete a file from Cloudflare R2
 */
export const deleteFromR2 = async (key: string): Promise<void> => {
    const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
    });

    await r2Client.send(command);
};

/**
 * Get a signed URL for private file access (optional, for private buckets)
 */
export const getSignedUrlForR2 = async (key: string, expiresIn: number = 3600): Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
    });

    return await getSignedUrl(r2Client, command, { expiresIn });
};

export { r2Client };
