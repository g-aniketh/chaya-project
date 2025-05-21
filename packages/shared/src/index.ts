import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export * from '@prisma/client';

export * from './schemas/auth';
export * from './schemas/farmer';
export * from './schemas/users';
export * from './schemas/procurement';
export * from './schemas/processingBatch';
export * from './schemas/processingStage';
export * from './schemas/sale';
