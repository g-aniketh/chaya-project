import { z } from 'zod';

export const userSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'STAFF']).default('STAFF'),
  isEnabled: z.boolean().default(true),
  isActive: z.boolean().default(false),
  lastLoginAt: z.date().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  isEnabled: z.boolean().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export type ZodUser = z.infer<typeof userSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
