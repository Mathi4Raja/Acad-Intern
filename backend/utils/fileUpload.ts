import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// Configure storage (Memory storage for Cloudflare R2)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
): void => {
    if (
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png'
    ) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPG and PNG are allowed.'));
    }
};

// Initialize multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

export default upload;
