import { z } from 'zod';

export const createProcurementSchema = z.object({
  farmerId: z.number(),
  crop: z.string().min(1, 'Crop is required'),
  procuredForm: z.string().min(1, 'Procured form is required'),
  speciality: z.string().min(1, 'Speciality is required'),
  quantity: z.number().positive('Quantity must be a positive number'),
  date: z.string().transform(str => new Date(str)), // This should be the procurement date
  time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid time format (expected HH:mm:ss)'), // Procurement time
  lotNo: z.number().int().min(1, 'Lot number must be a positive integer'), // Max removed, can be any int now.
  procuredBy: z.string().min(1, 'Procured by is required'),
  vehicleNo: z.string().min(1, 'Vehicle number is required').optional(),
});

export type CreateProcurementInput = z.infer<typeof createProcurementSchema>;

export const updateProcurementSchema = createProcurementSchema.partial().extend({
  id: z.number(),
});
export type UpdateProcurementInput = z.infer<typeof updateProcurementSchema>;

export const procurementQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  search: z.string().optional(),
  farmerId: z.string().transform(Number).optional(),
  crop: z.string().optional(),
  lotNo: z.string().transform(Number).optional(),
  isBatched: z.boolean().optional(), // To filter procurements already in a batch or not
});

export type ProcurementQuery = z.infer<typeof procurementQuerySchema>;
