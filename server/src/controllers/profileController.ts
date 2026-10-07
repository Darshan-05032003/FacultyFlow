import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profileService';

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await ProfileService.getMyProfile(req.user!.id);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await ProfileService.updateMyProfile(req.user!.id, req.body);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const getMyDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const department = await ProfileService.getMyDepartment(req.user!.id);
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};
