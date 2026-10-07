import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../services/activityService';

export const createActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await ActivityService.createActivity(req.user!.id, req.body);
    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

export const getMyActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activities = await ActivityService.getMyActivities(req.user!.id, req.query);
    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

export const getActivityById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await ActivityService.getActivityById(req.user!.id, req.params.id as string);
    res.status(200).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

export const updateActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await ActivityService.updateActivity(req.user!.id, req.params.id as string, req.body);
    res.status(200).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

export const archiveActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await ActivityService.archiveActivity(req.user!.id, req.params.id as string);
    res.status(200).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

export const updateActivityStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await ActivityService.updateActivityStatus(req.user!.id, req.params.id as string, req.body.status);
    res.status(200).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

export const getWorkloadSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await ActivityService.getWorkloadSummary(req.user!.id, req.query);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};
