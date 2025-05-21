import { z } from 'zod';
import { ProcessingStageStatus } from '@prisma/client';

export const createProcessingBatchFirstStageSchema = z.object({
  processMethod: z.enum(['wet', 'dry'], { required_error: 'Process method is required' }),
  dateOfProcessing: z
    .string()
    .datetime({ message: 'Invalid datetime string. Must be UTC.' })
    .transform(str => new Date(str)),
  doneBy: z.string().min(1, 'Person responsible for P1 is required'),
});

export const createProcessingBatchSchema = z.object({
  crop: z.string().min(1, 'Crop is required'),
  lotNo: z.number().int().min(1, 'Lot number is required'),
  procurementIds: z.array(z.number().int()).min(1, 'At least one procurement must be selected'),
  firstStageDetails: createProcessingBatchFirstStageSchema,
});
export type CreateProcessingBatchInput = z.infer<typeof createProcessingBatchSchema>;

const queryStatusEnumValues: [string, ...string[]] = [
  ProcessingStageStatus.IN_PROGRESS,
  ProcessingStageStatus.FINISHED,
  ProcessingStageStatus.CANCELLED,
  'SOLD_OUT',
];

export const processingBatchQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  search: z.string().optional(),
  status: z.enum(queryStatusEnumValues).optional(),
});
export type ProcessingBatchQuery = z.infer<typeof processingBatchQuerySchema>;
