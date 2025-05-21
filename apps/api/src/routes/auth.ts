import type { FastifyInstance } from 'fastify';
import { hashPassword, verifyPassword } from '../lib/password';
import { prisma } from '@chaya/shared';
import { loginSchema, registerSchema } from '@chaya/shared';
import { authenticate, verifyAdmin, type AuthenticatedRequest, type JWTPayload } from '../middlewares/auth';
import type { FastifyRequest, FastifyReply } from 'fastify';

async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }

      if (!user.isEnabled) {
        return reply.status(403).send({
          error: 'Your account has been disabled. Please contact an administrator.',
        });
      }

      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }

      const token = fastify.jwt.sign(
        {
          id: user.id,
          role: user.role,
        } as Omit<JWTPayload, 'iat' | 'exp'>, // Sign with core fields, iat/exp added by jwt.sign
        {
          expiresIn: '7d',
        }
      );

      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          isActive: true,
        },
      });

      reply.setCookie('token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // maxAge in milliseconds
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      return reply.status(400).send({ error: 'Invalid request' });
    }
  });

  fastify.post('/logout', async (request, reply) => {
    try {
      if (request.cookies.token) {
        try {
          const decoded = fastify.jwt.verify<JWTPayload>(request.cookies.token);

          await prisma.user.update({
            where: { id: decoded.id },
            data: { isActive: false },
          });
        } catch (error) {
          // Token might be invalid or expired, clear cookie anyway
          console.warn('Token verification error on logout:', error);
        }
      }

      reply.clearCookie('token', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  fastify.post('/register', { preHandler: [verifyAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userData = registerSchema.parse(request.body);

      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        return reply.status(400).send({ error: 'Email already in use' });
      }

      const hashedPassword = await hashPassword(userData.password);

      const newUser = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
        },
      });

      return {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      };
    } catch (error) {
      console.error('Registration error:', error);
      return reply.status(400).send({ error: 'Invalid request' });
    }
  });

  fastify.get('/me', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest;
    try {
      const user = await prisma.user.findUnique({
        where: { id: authRequest.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isEnabled: true,
        },
      });

      if (!user || !user.isEnabled) {
        reply.clearCookie('token', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
        return reply.status(401).send({ error: 'User not found or disabled' });
      }

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      console.error('Get user error:', error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });
}

export default authRoutes;
