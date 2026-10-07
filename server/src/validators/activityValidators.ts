import { z } from 'zod';
import { ActivityCategory, ActivityStatus, RecurrenceType } from '@prisma/client';

export const createActivitySchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional(),
    category: z.nativeEnum(ActivityCategory),
    date: z.string().transform((str) => new Date(str)),
    estimatedMinutes: z.number().int().positive('Estimated duration must be positive').optional(),
    actualMinutes: z.number().int().min(0, 'Actual duration must be non-negative').optional(),
    deadline: z.string().transform((str) => new Date(str)).optional(),
    status: z.nativeEnum(ActivityStatus).optional(),
    courseId: z.string().uuid().optional(),
    isRecurring: z.boolean().optional(),
    recurrenceType: z.nativeEnum(RecurrenceType).optional(),
    recurrenceEndDate: z.string().transform((str) => new Date(str)).optional(),
  }),
});

export const updateActivitySchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255).optional(),
    description: z.string().optional(),
    category: z.nativeEnum(ActivityCategory).optional(),
    date: z.string().transform((str) => new Date(str)).optional(),
    estimatedMinutes: z.number().int().positive('Estimated duration must be positive').optional(),
    actualMinutes: z.number().int().min(0, 'Actual duration must be non-negative').optional(),
    deadline: z.string().transform((str) => new Date(str)).optional(),
    status: z.nativeEnum(ActivityStatus).optional(),
    courseId: z.string().uuid().optional(),
    isRecurring: z.boolean().optional(),
    recurrenceType: z.nativeEnum(RecurrenceType).optional(),
    recurrenceEndDate: z.string().transform((str) => new Date(str)).optional(),
    isArchived: z.boolean().optional(),
  }),
});

export const updateActivityStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(ActivityStatus),
  }),
});
