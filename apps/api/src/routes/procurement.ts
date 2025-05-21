import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@chaya/shared';
import { authenticate, verifyAdmin } from '../middlewares/auth';
import { createProcurementSchema, updateProcurementSchema, procurementQuerySchema } from '@chaya/shared';
import { generateProcurementNumber } from '../helper';
import { Prisma } from '@prisma/client';
import { format } from 'date-fns';

async function procurementRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { farmerId, crop, procuredForm, speciality, quantity, date, time, lotNo, procuredBy, vehicleNo } =
        createProcurementSchema.parse(request.body);

      const combinedDateTime = new Date(`${date.toISOString().split('T')[0]}T${time}`);
      if (isNaN(combinedDateTime.getTime())) {
        return reply.status(400).send({ error: 'Invalid date or time combination' });
      }

      const procurementNumber = generateProcurementNumber(crop, date, lotNo);

      const existingProcurement = await prisma.procurement.findUnique({
        where: { procurementNumber },
      });

      if (existingProcurement) {
        return reply.status(400).send({
          error: 'Procurement number already exists. This might indicate a duplicate entry or a hash collision (rare).',
        });
      }

      const farmerExists = await prisma.farmer.findUnique({ where: { id: farmerId } });
      if (!farmerExists) {
        return reply.status(404).send({ error: 'Farmer not found.' });
      }

      const procurement = await prisma.procurement.create({
        data: {
          farmerId,
          crop,
          procuredForm,
          speciality,
          quantity,
          procurementNumber,
          date,
          time: combinedDateTime,
          lotNo,
          procuredBy,
          vehicleNo,
        },
      });

      return { procurement };
    } catch (error: any) {
      if (error.issues) {
        return reply.status(400).send({ error: 'Invalid request data', details: error.issues });
      }
      console.error('Create procurement error:', error);
      return reply.status(500).send({ error: 'Server error creating procurement' });
    }
  });

  fastify.get('/', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const {
        page,
        limit,
        search,
        farmerId,
        crop,
        lotNo: queryLotNo,
        isBatched,
      } = procurementQuerySchema.parse(request.query);
      const skip = (page - 1) * limit;
      const where: Prisma.ProcurementWhereInput = {};

      if (search) {
        where.OR = [
          { procurementNumber: { contains: search, mode: 'insensitive' } },
          { crop: { contains: search, mode: 'insensitive' } },
          { procuredBy: { contains: search, mode: 'insensitive' } },
          { farmer: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }
      if (farmerId) where.farmerId = farmerId;
      if (crop) where.crop = { contains: crop, mode: 'insensitive' };
      if (queryLotNo) where.lotNo = queryLotNo;

      if (typeof isBatched === 'boolean') {
        where.processingBatchId = isBatched ? { not: null } : { equals: null };
      }

      const [procurements, totalCount] = await Promise.all([
        prisma.procurement.findMany({
          where,
          include: {
            farmer: { select: { id: true, name: true, village: true, panchayath: true, mandal: true } },
            processingBatch: { select: { id: true, batchCode: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.procurement.count({ where }),
      ]);

      return {
        procurements,
        pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
      };
    } catch (error: any) {
      if (error.issues) {
        return reply.status(400).send({ error: 'Invalid query parameters', details: error.issues });
      }
      console.error('Get procurements error:', error);
      return reply.status(500).send({ error: 'Server error fetching procurements' });
    }
  });

  fastify.get('/unbatched', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { crop, lotNo } = request.query as { crop?: string; lotNo?: string }; // Removed procuredForm as it's not used here

      const whereClause: Prisma.ProcurementWhereInput = {
        processingBatchId: null,
      };

      if (crop) {
        whereClause.crop = { equals: crop, mode: 'insensitive' };
      }
      if (lotNo) {
        const parsedLotNo = parseInt(lotNo, 10);
        if (!isNaN(parsedLotNo)) {
          whereClause.lotNo = parsedLotNo;
        }
      }

      const unbatchedProcurements = await prisma.procurement.findMany({
        where: whereClause,
        include: { farmer: { select: { name: true, village: true } } },
        orderBy: [{ date: 'asc' }, { id: 'asc' }],
        take: 500,
      });
      return { procurements: unbatchedProcurements };
    } catch (error) {
      console.error('Error fetching unbatched procurements:', error);
      // Log the actual Prisma error if it's a Prisma error
      if (
        error instanceof Prisma.PrismaClientKnownRequestError ||
        error instanceof Prisma.PrismaClientValidationError
      ) {
        console.error('Prisma Error Meta:', (error as any).meta);
      }
      return reply.status(500).send({ error: 'Failed to fetch unbatched procurements' });
    }
  });

  fastify.get('/:id', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const procurementId = parseInt(id);
      if (isNaN(procurementId)) return reply.status(400).send({ error: 'Invalid ID format.' });

      const procurement = await prisma.procurement.findUnique({
        where: { id: procurementId },
        include: {
          farmer: { select: { name: true, village: true, panchayath: true, mandal: true } },
          processingBatch: { select: { id: true, batchCode: true } },
        },
      });

      if (!procurement) return reply.status(404).send({ error: 'Procurement not found' });
      return { procurement };
    } catch (error) {
      console.error('Get procurement error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  fastify.put('/:id', { preHandler: [verifyAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const procurementId = parseInt(id);
      if (isNaN(procurementId)) return reply.status(400).send({ error: 'Invalid ID format.' });

      const data = updateProcurementSchema.parse({ ...(request.body as object), id: procurementId });

      const existingProcurement = await prisma.procurement.findUnique({ where: { id: procurementId } });
      if (!existingProcurement) return reply.status(404).send({ error: 'Procurement not found' });
      if (existingProcurement.processingBatchId) {
        return reply.status(400).send({ error: 'Cannot edit procurement already assigned to a processing batch.' });
      }

      let combinedDateTime;
      const newDate = data.date ? data.date : existingProcurement.date;
      const newTimeStr = data.time ? data.time : format(existingProcurement.time, 'HH:mm:ss');

      combinedDateTime = new Date(`${format(newDate, 'yyyy-MM-dd')}T${newTimeStr}`);

      if (isNaN(combinedDateTime.getTime())) {
        return reply.status(400).send({ error: 'Invalid date or time combination resulted' });
      }

      const updatedProcurement = await prisma.procurement.update({
        where: { id: procurementId },
        data: {
          farmerId: data.farmerId,
          crop: data.crop,
          procuredForm: data.procuredForm,
          speciality: data.speciality,
          quantity: data.quantity,
          date: data.date,
          time: combinedDateTime,
          lotNo: data.lotNo,
          procuredBy: data.procuredBy,
          vehicleNo: data.vehicleNo,
        },
      });
      return { procurement: updatedProcurement };
    } catch (error: any) {
      if (error.issues) return reply.status(400).send({ error: 'Invalid request data', details: error.issues });
      console.error('Update procurement error:', error);
      return reply.status(500).send({ error: 'Server error updating procurement' });
    }
  });

  fastify.delete('/:id', { preHandler: [verifyAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const procurementId = parseInt(id);
      if (isNaN(procurementId)) return reply.status(400).send({ error: 'Invalid ID format.' });

      const procurement = await prisma.procurement.findUnique({ where: { id: procurementId } });
      if (!procurement) return reply.status(404).send({ error: 'Procurement not found' });
      if (procurement.processingBatchId) {
        return reply.status(400).send({
          error: 'Cannot delete procurement already assigned to a processing batch. Remove from batch first.',
        });
      }

      await prisma.procurement.delete({ where: { id: procurementId } });
      return { success: true };
    } catch (error) {
      console.error('Delete procurement error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  fastify.delete('/bulk', { preHandler: [verifyAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { ids } = request.body as { ids?: number[] };
      if (!Array.isArray(ids) || ids.length === 0) {
        return reply.status(400).send({ error: 'Invalid or empty list of IDs' });
      }
      const validIds = ids.filter(id => typeof id === 'number' && !isNaN(id));
      if (validIds.length !== ids.length) {
        return reply.status(400).send({ error: 'All IDs must be numbers.' });
      }

      const batchedProcurements = await prisma.procurement.count({
        where: { id: { in: validIds }, processingBatchId: { not: null } },
      });
      if (batchedProcurements > 0) {
        return reply
          .status(400)
          .send({ error: 'One or more selected procurements are part of a batch and cannot be deleted.' });
      }

      const { count } = await prisma.procurement.deleteMany({ where: { id: { in: validIds } } });
      return { success: true, message: `${count} procurements deleted.` };
    } catch (error) {
      console.error('Bulk delete procurements error:', error);
      return reply.status(500).send({ error: 'Server error during bulk delete' });
    }
  });
}

export default procurementRoutes;
