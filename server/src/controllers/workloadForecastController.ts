import { Request, Response, NextFunction } from 'express';
import { WorkloadForecastService } from '../services/workloadForecastService';

export const getForecast = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forecast = await WorkloadForecastService.getForecast(req.user!.id, req.query);
    res.status(200).json({ success: true, data: forecast });
  } catch (error) {
    next(error);
  }
};
