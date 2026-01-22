import { Router, Response, NextFunction } from 'express';
import upload from '../utils/fileUpload';
import { uploadToR2, isR2Configured } from '../utils/r2Storage';
import { protect } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

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

        const result = await uploadToR2(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
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

