import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

// Upload result interface (matches S3/R2 response format for consistency)
export interface UploadResult {
    secure_url: string;
    public_id: string;
    format: string;
    bytes: number;
}

/**
 * Extract the key from a full R2 URL
 */
export const getKeyFromUrl = (url: string): string | null => {
    if (!url) return null;

    // If it's already a key (starts with acadintern/)
    if (url.startsWith('acadintern/')) {
        return url;
    }

    // Extract key from full URL
    try {
        const urlObj = new URL(url);
        // Remove leading slash
        return urlObj.pathname.substring(1);
    } catch {
        return null;
    }
};

/**
 * Upload a file buffer to Cloudflare R2
 * @param buffer - File buffer
 * @param originalFilename - Original filename (used for extension)
 * @param mimetype - MIME type
 * @param username - Sanitized username for consistent naming
 * @param existingUrl - Existing file URL to delete (for replace functionality)
 */
export const uploadToR2 = async (
    buffer: Buffer,
    originalFilename: string,
    mimetype: string,
    username?: string,
    existingUrl?: string
): Promise<UploadResult> => {
    // Generate filename based on username for consistency
    const ext = path.extname(originalFilename).toLowerCase();
    const key = username
        ? `acadintern/resumes/${username}_resume${ext}`
        : `acadintern/resumes/${Date.now()}_resume${ext}`;

    // Delete existing file if replacing (different extension case)
    if (existingUrl) {
        const existingKey = getKeyFromUrl(existingUrl);
        if (existingKey && existingKey !== key) {
            try {
                await deleteFromR2(existingKey);
                console.log(`🗑️ Deleted old file: ${existingKey}`);
            } catch (err) {
                console.error('Failed to delete old file:', err);
                // Continue with upload even if delete fails
            }
        }
    }

    // Upload to R2 (overwrites if same key exists)
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

/**
 * Check if a file exists in R2
 */
export const hasFile = async (key: string): Promise<boolean> => {
    try {
        const command = new HeadObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        });
        await r2Client.send(command);
        return true;
    } catch (error) {
        return false;
    }
};

/**
 * Get file as a stream from R2
 */
export const getFileStream = async (key: string) => {
    const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
    });
    const response = await r2Client.send(command);
    return response.Body;
};

export { r2Client };
