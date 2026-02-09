
import maintenanceMiddleware from '../middleware/maintenanceMiddleware';
import { Request, Response, NextFunction } from 'express';
import SystemSetting from '../models/SystemSetting';

// Mock SystemSetting
jest.mock('../models/SystemSetting');

describe('Maintenance Middleware Unit', () => {
    let req: any;
    let res: any;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            path: '',
            originalUrl: '',
            url: ''
        } as any;
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        (SystemSetting.findOne as jest.Mock).mockReset();
    });

    it('should skip auth routes via originalUrl', async () => {
        req.originalUrl = '/api/auth/login';
        req.path = '/api/auth/login';

        await maintenanceMiddleware(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
        expect(SystemSetting.findOne).not.toHaveBeenCalled();
    });

    it('should skip auth routes via path', async () => {
        req.originalUrl = undefined; // simulate weird case
        req.path = '/api/auth/login';

        await maintenanceMiddleware(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
    });

    it('should block normal routes when maintenance is on', async () => {
        req.path = '/api/internships';
        req.originalUrl = '/api/internships';

        (SystemSetting.findOne as jest.Mock).mockResolvedValue({ key: 'maintenanceMode', value: true });

        await maintenanceMiddleware(req as Request, res as Response, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(503);
    });

    it('should allow admin routes when maintenance is on', async () => {
        req.path = '/api/admin/dashboard';
        (SystemSetting.findOne as jest.Mock).mockResolvedValue({ key: 'maintenanceMode', value: true });

        await maintenanceMiddleware(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
    });
});
