import { Request, Response, NextFunction } from 'express';
import { AIAssistantService } from '../services/aiAssistantService';
import { z } from 'zod';

const AssistantRequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(1000, 'Message is too long')
});

export const getAssistantResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = AssistantRequestSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ success: false, errors: validated.error.issues });
    }

    const response = await AIAssistantService.getAssistantResponse(req.user!.id, validated.data.message);
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};
