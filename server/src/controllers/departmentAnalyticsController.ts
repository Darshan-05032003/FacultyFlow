import { Request, Response, NextFunction } from 'express';
import { DepartmentAnalyticsService } from '../services/departmentAnalyticsService';

export const getDepartmentAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await DepartmentAnalyticsService.getAnalytics(req.user!.id, req.query);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};
