import { Router, Response, NextFunction } from 'express';
import upload from '../utils/fileUpload';
import { uploadToR2, isR2Configured } from '../utils/r2Storage';
import { protect } from '../middleware/auth';
import { AuthRequest } from '../types';
import StudentProfile from '../models/StudentProfile';

const router = Router();

// @desc    Validate if a file URL exists
// @route   POST /api/upload/validate
// @access  Private
router.post('/validate', protect, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { url } = req.body;

        if (!url) {
            res.status(400).json({
                success: false,
                message: 'URL is required'
            });
            return;
        }

        // Make HEAD request to check if file exists
        const response = await fetch(url, { method: 'HEAD' });

        res.status(200).json({
            success: true,
            data: {
                exists: response.ok,
                status: response.status
            }
        });
    } catch (error) {
        // If request fails, file doesn't exist or isn't accessible
        res.status(200).json({
            success: true,
            data: {
                exists: false,
                error: 'URL not accessible'
            }
        });
    }
});

// @desc    Upload file (Resume/Image)
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('file'), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
            return;
        }

        if (!isR2Configured()) {
            res.status(500).json({
                success: false,
                message: 'Cloud storage is not configured on the server'
            });
            return;
        }

        // Get existing resume URL for replacement (delete old file)
        let existingUrl: string | undefined;
        if (req.body.type === 'resume' && req.user) {
            const profile = await StudentProfile.findOne({ userId: req.user._id });
            existingUrl = profile?.resumeUrl;
        }

        // Sanitize username for filename (remove special chars, spaces)
        const sanitizedName = req.user?.name
            ?.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .substring(0, 30) || 'user';

        const result = await uploadToR2(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            sanitizedName, // Use sanitized username for consistent naming
            existingUrl // Pass existing URL to delete old file
        );

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                size: result.bytes
            }
        });
    } catch (error) {
        const err = error as Error;
        if (err.message.includes('Invalid file type')) {
            res.status(400).json({
                success: false,
                message: err.message
            });
            return;
        }
        next(error);
    }
});

export default router;
