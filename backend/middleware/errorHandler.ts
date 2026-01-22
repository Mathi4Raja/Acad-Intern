import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
    statusCode?: number;
    code?: number;
    keyValue?: Record<string, unknown>;
    errors?: Record<string, { message: string }>;
}

const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Server Error';

    // Mongoose duplicate key error
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue || {})[0];
        message = `${field} already exists`;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError' && err.errors) {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((error) => error.message)
            .join(', ');
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export default errorHandler;
