import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@chaya/shared';

export interface JWTPayload {
  id: number;
  role: 'ADMIN' | 'STAFF';
  iat: number;
  exp: number;
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.cookies.token;
    if (!token) {
      console.log('No token found in cookies');
      reply.status(401).send({ error: 'Authentication required' });
      return false;
    }
    const decoded = request.server.jwt.verify<JWTPayload>(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id, isEnabled: true },
    });
    if (!user) {
      console.log('User not found or disabled');
      reply.status(401).send({ error: 'User not found or disabled' });
      return false;
    }
    (request as any).user = decoded;
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    reply.status(401).send({ error: 'Invalid or expired token, try again after refreshing the page.' });
    return false;
  }
}

export async function verifyAdmin(request: FastifyRequest, reply: FastifyReply) {
  const isAuthenticated = await authenticate(request, reply);
  if (!isAuthenticated) return false;

  const user = (request as any).user as JWTPayload;
  if (!user || user.role !== 'ADMIN') {
    console.log('User is not an admin. Role:', user?.role);
    reply.status(403).send({ error: 'Admin access required' });
    return false;
  }
  return true;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: JWTPayload;
}
