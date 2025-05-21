import type { FastifyInstance } from 'fastify';
import { prisma } from '@chaya/shared';
import { verifyAdmin, type AuthenticatedRequest } from '../middlewares/auth';
import { updateUserSchema } from '@chaya/shared';
import { hashPassword } from '../lib/password';
import redisClient from '../lib/redis';

const USER_DETAIL_CACHE_PREFIX = 'users:';
const USER_LIST_CACHE_PREFIX = 'users:list';
const CACHE_TTL_SECONDS = 3600;

async function invalidateUserCache(userId?: number | string) {
  const keysToDelete: string[] = [];
  if (userId) {
    keysToDelete.push(`${USER_DETAIL_CACHE_PREFIX}${userId}`);
  }
  const listKeys = await redisClient.keys(`${USER_LIST_CACHE_PREFIX}*`);
  if (listKeys.length > 0) {
    keysToDelete.push(...listKeys);
  }

  if (keysToDelete.length > 0) {
    try {
      await redisClient.del(keysToDelete);
      console.log(`Invalidated user cache for: ${keysToDelete.join(', ')}`);
    } catch (e) {
      console.error('Redis DEL error (user cache):', e);
    }
  }
}

async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: verifyAdmin }, async (request, reply) => {
    const cacheKey = `${USER_LIST_CACHE_PREFIX}:all`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`Cache hit for ${cacheKey}`);
        return { users: JSON.parse(cached) };
      }
      console.log(`Cache miss for ${cacheKey}`);
    } catch (e) {
      console.error(`Redis GET error (${cacheKey}):`, e);
    }
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isEnabled: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      try {
        await redisClient.set(cacheKey, JSON.stringify(users), 'EX', CACHE_TTL_SECONDS);
      } catch (e) {
        console.error(`Redis SET error (${cacheKey}):`, e);
      }
      return { users };
    } catch (error) {
      console.error('DB error fetching users:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  fastify.get('/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const cacheKey = `${USER_DETAIL_CACHE_PREFIX}${id}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`Cache hit for ${cacheKey}`);
        return { user: JSON.parse(cached) };
      }
      console.log(`Cache miss for ${cacheKey}`);
    } catch (e) {
      console.error(`Redis GET error (${cacheKey}):`, e);
    }
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isEnabled: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      try {
        await redisClient.set(cacheKey, JSON.stringify(user), 'EX', CACHE_TTL_SECONDS);
      } catch (e) {
        console.error(`Redis SET error (${cacheKey}):`, e);
      }
      return { user };
    } catch (error) {
      console.error(`DB error fetching user ${id}:`, error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  fastify.put('/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = parseInt(id);
      if (isNaN(userId)) {
        return reply.status(400).send({ error: 'Invalid user ID' });
      }

      const userData = updateUserSchema.parse(request.body);
      const existingUser = await prisma.user.findUnique({
        where: { id: parseInt(id) },
      });
      if (!existingUser) {
        return reply.status(404).send({ error: 'User not found' });
      }
      const updateData: any = {};
      if (userData.name) updateData.name = userData.name;
      if (userData.email) updateData.email = userData.email;
      if (userData.isEnabled !== undefined) updateData.isEnabled = userData.isEnabled;
      if (userData.password) {
        updateData.password = await hashPassword(userData.password);
      }
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isEnabled: true,
          isActive: true,
          lastLoginAt: true,
          updatedAt: true,
        },
      });
      await invalidateUserCache(userId);
      return { user: updatedUser };
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid request' });
    }
  });

  fastify.patch('/:id/toggle-status', { preHandler: verifyAdmin }, async (request, reply) => {
    const authRequest = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };
    const userId = parseInt(id);
    if (isNaN(userId)) return reply.status(400).send({ error: 'Invalid user ID' });

    try {
      const { id } = authRequest.params as { id: string };
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
      });
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { isEnabled: !user.isEnabled },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isEnabled: true,
        },
      });
      await invalidateUserCache(userId);
      return { user: updatedUser };
    } catch (error) {
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  fastify.delete('/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = parseInt(id);
    if (isNaN(userId)) return reply.status(400).send({ error: 'Invalid user ID' });
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
      });
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      if (user.role === 'ADMIN') {
        return reply.status(403).send({ error: 'Cannot delete admin users' });
      }
      await prisma.user.delete({
        where: { id: parseInt(id) },
      });
      await invalidateUserCache(userId);
      return { success: true };
    } catch (error) {
      return reply.status(500).send({ error: 'Server error' });
    }
  });
}

export default userRoutes;
