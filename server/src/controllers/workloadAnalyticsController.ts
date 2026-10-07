import { Request, Response, NextFunction } from 'express';
import { WorkloadAnalyticsService } from '../services/workloadAnalyticsService';

export const getWorkloadAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await WorkloadAnalyticsService.getAnalytics(req.user!.id, req.query);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};
