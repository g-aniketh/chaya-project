import type { FastifyInstance } from 'fastify';
import { prisma } from '@chaya/shared';
import { authenticate, verifyAdmin } from '../middlewares/auth';
import type { AuthenticatedRequest } from '../middlewares/auth';

import { fieldSchema } from '@chaya/shared';

async function fieldRoutes(fastify: FastifyInstance) {
  fastify.get('/farmer/:farmerId', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { farmerId } = request.params as { farmerId: string };

      const fields = await prisma.field.findMany({
        where: { farmerId: parseInt(farmerId) },
        orderBy: { createdAt: 'desc' },
      });

      return { fields };
    } catch (error) {
      console.error('Get fields error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const field = await prisma.field.findUnique({
        where: { id: parseInt(id) },
      });

      if (!field) {
        return reply.status(404).send({ error: 'Field not found' });
      }

      return { field };
    } catch (error) {
      console.error('Get field error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  fastify.post('/farmer/:farmerId', { preHandler: authenticate }, async (request, reply) => {
    try {
      const authRequest = request as AuthenticatedRequest;

      const { farmerId } = request.params as { farmerId: string };
      const fieldData = fieldSchema.parse(request.body);

      const farmer = await prisma.farmer.findUnique({
        where: { id: parseInt(farmerId) },
      });

      if (!farmer) {
        return reply.status(404).send({ error: 'Farmer not found' });
      }

      const field = await prisma.field.create({
        data: {
          ...fieldData,
          farmerId: parseInt(farmerId),
        },
      });

      await prisma.farmer.update({
        where: { id: parseInt(farmerId) },
        data: { updatedById: authRequest.user.id },
      });

      return { field };
    } catch (error) {
      console.error('Create field error:', error);
      return reply.status(400).send({ error: 'Invalid field data' });
    }
  });

  fastify.put('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const authRequest = request as AuthenticatedRequest;

      const { id } = request.params as { id: string };
      const fieldData = fieldSchema.parse(request.body);

      const field = await prisma.field.findUnique({
        where: { id: parseInt(id) },
      });

      if (!field) {
        return reply.status(404).send({ error: 'Field not found' });
      }

      if (authRequest.user.role !== 'ADMIN') {
        const farmer = await prisma.farmer.findUnique({
          where: { id: field.farmerId },
        });

        if (farmer?.createdById !== authRequest.user.id) {
          return reply.status(403).send({ error: 'Not authorized to update this field' });
        }
      }

      const updatedField = await prisma.field.update({
        where: { id: parseInt(id) },
        data: fieldData,
      });

      await prisma.farmer.update({
        where: { id: field.farmerId },
        data: { updatedById: authRequest.user.id },
      });

      return { field: updatedField };
    } catch (error) {
      console.error('Update field error:', error);
      return reply.status(400).send({ error: 'Invalid field data' });
    }
  });

  fastify.delete('/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    try {
      const authRequest = request as AuthenticatedRequest;

      const { id } = request.params as { id: string };

      const field = await prisma.field.findUnique({
        where: { id: parseInt(id) },
      });

      if (!field) {
        return reply.status(404).send({ error: 'Field not found' });
      }

      await prisma.field.delete({
        where: { id: parseInt(id) },
      });

      await prisma.farmer.update({
        where: { id: field.farmerId },
        data: { updatedById: authRequest.user.id },
      });

      return { success: true };
    } catch (error) {
      console.error('Delete field error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });
}

export default fieldRoutes;
