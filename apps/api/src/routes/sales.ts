import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma, Prisma } from '@chaya/shared';
import { authenticate, verifyAdmin, type AuthenticatedRequest } from '../middlewares/auth';
import { createSaleSchema } from '@chaya/shared';
import Redis from 'ioredis';

const redis = new Redis();

async function invalidateSalesCache(batchId?: number | string) {
  const keysToDelete: string[] = [];
  const listKeys = await redis.keys('processing-batches:list:*');
  if (listKeys.length) keysToDelete.push(...listKeys);
  if (batchId) keysToDelete.push(`processing-batch:${batchId}`);
  if (keysToDelete.length) await redis.del(...keysToDelete);
}

async function salesRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const authUser = (request as AuthenticatedRequest).user;
    try {
      const userId = authUser.id;
      const parsedSaleData = createSaleSchema.parse(request.body);
      const { processingBatchId, processingStageId, quantitySold, dateOfSale } = parsedSaleData;

      const stage = await prisma.processingStage.findUnique({
        where: { id: processingStageId },
        include: { processingBatch: true },
      });

      if (!stage) return reply.status(404).send({ error: 'Processing stage not found.' });
      if (stage.processingBatchId !== processingBatchId) {
        return reply.status(400).send({ error: 'Stage does not belong to the specified batch.' });
      }
      if (stage.status !== 'FINISHED') {
        return reply.status(400).send({ error: 'Sales can only be recorded from FINISHED processing stages.' });
      }

      const salesFromThisStage = await prisma.sale.aggregate({
        _sum: { quantitySold: true },
        where: { processingStageId: stage.id },
      });
      const alreadySoldFromStage = salesFromThisStage._sum.quantitySold || 0;
      const availableFromStage = (stage.quantityAfterProcess || 0) - alreadySoldFromStage;

      if (availableFromStage < quantitySold) {
        return reply.status(400).send({
          error: `Insufficient quantity available from stage P${stage.processingCount}. Available: ${availableFromStage.toFixed(2)} kg.`,
        });
      }

      const newSale = await prisma.sale.create({
        data: {
          processingBatchId,
          processingStageId,
          quantitySold,
          dateOfSale,
          createdById: userId,
        },
      });

      await invalidateSalesCache(processingBatchId);
      return reply.status(201).send(newSale);
    } catch (error: any) {
      if (error.issues) return reply.status(400).send({ error: 'Invalid request data', details: error.issues });
      console.error('Record sale error:', error);
      return reply.status(500).send({ error: 'Server error recording sale' });
    }
  });

  // GET route remains the same
  fastify.get('/', { preHandler: [verifyAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { processingBatchId, processingStageId } = request.query as {
      processingBatchId?: string;
      processingStageId?: string;
    };
    const where: Prisma.SaleWhereInput = {};
    if (processingBatchId) where.processingBatchId = parseInt(processingBatchId);
    if (processingStageId) where.processingStageId = parseInt(processingStageId);

    const sales = await prisma.sale.findMany({
      where,
      include: {
        processingBatch: { select: { batchCode: true, crop: true } },
        processingStage: { select: { processingCount: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { dateOfSale: 'desc' },
    });
    return sales;
  });
}

export default salesRoutes;
