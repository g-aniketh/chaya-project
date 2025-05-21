import { z } from 'zod';

export const createProcessingStageSchema = z.object({
  processingBatchId: z.number().int(),
  previousStageId: z.number().int().optional(),
  processMethod: z.enum(['wet', 'dry'], { required_error: 'Process method is required' }),
  dateOfProcessing: z
    .string()
    .datetime({ message: 'Invalid datetime string. Must be UTC.' })
    .transform(str => new Date(str)),
  doneBy: z.string().min(1, 'Person responsible is required'),
});
export type CreateProcessingStageInput = z.infer<typeof createProcessingStageSchema>;

export const finalizeProcessingStageSchema = z.object({
  dateOfCompletion: z
    .string()
    .datetime({ message: 'Invalid datetime string. Must be UTC.' })
    .transform(str => new Date(str)),
  quantityAfterProcess: z.coerce
    .number({
      required_error: 'Final quantity is required',
      invalid_type_error: 'Final quantity must be a number',
    })
    .positive('Final quantity must be a positive number'),
});
export type FinalizeProcessingStageInput = z.infer<typeof finalizeProcessingStageSchema>;

export const createDryingEntrySchema = z.object({
  processingStageId: z.number().int(),
  day: z.number().int().positive('Day must be a positive integer'),
  temperature: z.number({ required_error: 'Temperature is required' }),
  humidity: z.number().min(0).max(100, 'Humidity must be between 0 and 100'),
  pH: z.number().min(0).max(14, 'pH must be between 0 and 14'),
  moisturePercentage: z.number().min(0).max(100, 'Moisture % must be between 0 and 100'),
  currentQuantity: z.coerce
    .number({
      required_error: 'Current quantity is required',
      invalid_type_error: 'Current quantity must be a number',
    })
    .positive('Current quantity after drying must be positive'),
});
export type CreateDryingEntryInput = z.infer<typeof createDryingEntrySchema>;
