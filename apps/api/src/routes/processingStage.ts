import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma, Prisma, ProcessingStageStatus } from '@chaya/shared';
import { authenticate, type AuthenticatedRequest } from '../middlewares/auth';
import { createProcessingStageSchema, finalizeProcessingStageSchema, createDryingEntrySchema } from '@chaya/shared';
import Redis from 'ioredis';

const redis = new Redis();

async function invalidateStageRelatedCache(batchId?: number | string, stageId?: number | string) {
  const keysToDelete: string[] = [];
  const listKeys = await redis.keys('processing-batches:list:*');
  if (listKeys.length) keysToDelete.push(...listKeys);
  if (batchId) {
    keysToDelete.push(`processing-batch:${batchId}`);
  }
  if (keysToDelete.length) await redis.del(...keysToDelete);
}

async function processingStageRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const authUser = (request as AuthenticatedRequest).user;
    try {
      const userId = authUser.id;
      const { processingBatchId, previousStageId, processMethod, dateOfProcessing, doneBy } =
        createProcessingStageSchema.parse(request.body);

      const batch = await prisma.processingBatch.findUnique({
        where: { id: processingBatchId },
        include: {
          processingStages: {
            orderBy: { processingCount: 'asc' },
            take: 1,
            include: { sales: { select: { quantitySold: true } } },
          },
        },
      });

      if (!batch) return reply.status(404).send({ error: 'Processing batch not found.' });

      const latestStageFromBatch = batch.processingStages[0];
      if (!latestStageFromBatch)
        return reply.status(400).send({ error: 'No initial stage found for this batch. Cannot start a new stage.' });

      if (previousStageId !== latestStageFromBatch.id) {
        return reply.status(400).send({
          error: 'Mismatch: previousStageId from payload does not match the actual latest stage of the batch.',
        });
      }

      if (latestStageFromBatch.status !== ProcessingStageStatus.FINISHED) {
        return reply.status(400).send({ error: 'The latest processing stage must be FINISHED to start a new one.' });
      }

      if (latestStageFromBatch.quantityAfterProcess === null || latestStageFromBatch.quantityAfterProcess <= 0) {
        return reply.status(400).send({ error: 'Previous stage has no output quantity (yield) to process further.' });
      }

      // Calculate quantity sold specifically from this latestStage (the previous stage)
      const soldFromLatestStage = latestStageFromBatch.sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
      const netYieldFromPreviousStage = (latestStageFromBatch.quantityAfterProcess || 0) - soldFromLatestStage;

      if (netYieldFromPreviousStage <= 0) {
        return reply.status(400).send({
          error: `Previous stage (P${latestStageFromBatch.processingCount}) has no remaining quantity after sales to start a new stage. Available: ${netYieldFromPreviousStage.toFixed(2)}kg.`,
        });
      }

      const newStage = await prisma.processingStage.create({
        data: {
          processingBatchId,
          processingCount: latestStageFromBatch.processingCount + 1,
          processMethod,
          dateOfProcessing,
          doneBy,
          initialQuantity: netYieldFromPreviousStage,
          status: ProcessingStageStatus.IN_PROGRESS,
          createdById: userId,
        },
      });

      await invalidateStageRelatedCache(processingBatchId, newStage.id.toString());
      return reply.status(201).send(newStage);
    } catch (error: any) {
      if (error.issues) return reply.status(400).send({ error: 'Invalid request data', details: error.issues });
      console.error('Create processing stage error:', error);
      return reply.status(500).send({ error: 'Server error creating processing stage' });
    }
  });

  fastify.put(
    '/:stageId/finalize',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { stageId } = request.params as { stageId: string };
        const id = parseInt(stageId);
        if (isNaN(id)) return reply.status(400).send({ error: 'Invalid Stage ID' });

        const { dateOfCompletion, quantityAfterProcess } = finalizeProcessingStageSchema.parse(request.body);

        const stage = await prisma.processingStage.findUnique({ where: { id } });
        if (!stage) return reply.status(404).send({ error: 'Processing stage not found.' });
        if (stage.status === ProcessingStageStatus.FINISHED || stage.status === ProcessingStageStatus.CANCELLED)
          return reply.status(400).send({ error: `Stage is already ${stage.status.toLowerCase()}.` });
        if (stage.status !== ProcessingStageStatus.IN_PROGRESS) {
          return reply.status(400).send({ error: 'Stage must be IN_PROGRESS to be finalized.' });
        }

        const updatedStage = await prisma.processingStage.update({
          where: { id },
          data: {
            dateOfCompletion,
            quantityAfterProcess,
            status: ProcessingStageStatus.FINISHED,
          },
        });

        await invalidateStageRelatedCache(updatedStage.processingBatchId, updatedStage.id.toString());
        return updatedStage;
      } catch (error: any) {
        if (error.issues) return reply.status(400).send({ error: 'Invalid request data', details: error.issues });
        console.error('Finalize stage error:', error);
        return reply.status(500).send({ error: 'Server error finalizing stage' });
      }
    }
  );

  fastify.post(
    '/:stageId/drying',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { stageId } = request.params as { stageId: string };
        const id = parseInt(stageId);
        if (isNaN(id)) return reply.status(400).send({ error: 'Invalid Stage ID' });

        const data = createDryingEntrySchema.parse({ ...(request.body as object), processingStageId: id });

        const stage = await prisma.processingStage.findUnique({ where: { id } });
        if (!stage) return reply.status(404).send({ error: 'Processing stage not found.' });
        if (stage.status !== ProcessingStageStatus.IN_PROGRESS) {
          return reply.status(400).send({ error: 'Can only add drying data to IN_PROGRESS stages.' });
        }

        const existingDryingForDay = await prisma.drying.findFirst({
          where: { processingStageId: id, day: data.day },
        });
        if (existingDryingForDay) {
          return reply.status(400).send({ error: `Drying data for day ${data.day} already exists for this stage.` });
        }

        const newDryingEntry = await prisma.drying.create({ data });
        await invalidateStageRelatedCache(stage.processingBatchId, stage.id.toString());
        return reply.status(201).send(newDryingEntry);
      } catch (error: any) {
        if (error.issues)
          return reply.status(400).send({ error: 'Invalid request data for drying entry', details: error.issues });
        console.error('Add drying data error:', error);
        return reply.status(500).send({ error: 'Server error adding drying data' });
      }
    }
  );

  fastify.get(
    '/:stageId/drying',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { stageId } = request.params as { stageId: string };
        const id = parseInt(stageId);
        if (isNaN(id)) return reply.status(400).send({ error: 'Invalid Stage ID' });

        const dryingEntries = await prisma.drying.findMany({
          where: { processingStageId: id },
          orderBy: { day: 'asc' },
        });
        return { dryingEntries };
      } catch (error) {
        console.error('Get drying data error:', error);
        return reply.status(500).send({ error: 'Server error fetching drying data' });
      }
    }
  );
}
export default processingStageRoutes;
