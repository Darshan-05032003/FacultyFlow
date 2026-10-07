import { Request, Response, NextFunction } from 'express';
import { TaskPrioritizationService } from '../services/taskPrioritizationService';

export const getPriorities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const priorities = await TaskPrioritizationService.getPriorities(req.user!.id, req.query);
    res.status(200).json({ success: true, data: priorities });
  } catch (error) {
    next(error);
  }
};

export const getTopPriorities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add limit=5 for top priorities
    const priorities = await TaskPrioritizationService.getPriorities(req.user!.id, { ...req.query, limit: 5 });
    res.status(200).json({ success: true, data: priorities });
  } catch (error) {
    next(error);
  }
};
