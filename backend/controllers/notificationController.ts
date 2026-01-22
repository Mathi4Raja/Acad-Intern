import { Response, NextFunction } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../types';

// @desc    Get my notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const notifications = await Notification.find({ userId: req.user?._id })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            userId: req.user?._id,
            read: false
        });

        res.status(200).json({
            success: true,
            data: {
                items: notifications,
                unreadCount
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user?._id
        });

        if (!notification) {
            res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
            return;
        }

        notification.read = true;
        await notification.save();

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark all as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        await Notification.updateMany(
            { userId: req.user?._id, read: false },
            { $set: { read: true } }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        next(error);
    }
};
