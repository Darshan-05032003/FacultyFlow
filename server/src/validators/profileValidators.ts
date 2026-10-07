import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    designation: z.string().optional(),
    phone: z.string().optional(),
    officeLocation: z.string().optional(),
    bio: z.string().max(1000, 'Bio is too long').optional(),
  }),
});
