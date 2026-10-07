import { Request, Response, NextFunction } from 'express';
import { WhatIfSimulatorService, SimulationAction } from '../services/whatIfSimulatorService';
import { z } from 'zod';

const ActionSchema = z.union([
  z.object({
    type: z.literal('ADD_ACTIVITY'),
    title: z.string().min(1),
    date: z.string(),
    estimatedMinutes: z.number().positive(),
    category: z.string().min(1)
  }),
  z.object({
    type: z.literal('MOVE_ACTIVITY'),
    activityId: z.string().min(1),
    newDate: z.string()
  }),
  z.object({
    type: z.literal('CHANGE_DURATION'),
    activityId: z.string().min(1),
    estimatedMinutes: z.number().nonnegative()
  }),
  z.object({
    type: z.literal('REMOVE_ACTIVITY'),
    activityId: z.string().min(1)
  })
]);

const SimulatorRequestSchema = z.object({
  scenario: ActionSchema
});

export const simulateWorkload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = SimulatorRequestSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ success: false, errors: validated.error.issues });
    }

    const result = await WhatIfSimulatorService.simulate(req.user!.id, validated.data.scenario as SimulationAction);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
