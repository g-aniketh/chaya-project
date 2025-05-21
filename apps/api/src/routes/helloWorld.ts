import type { FastifyInstance } from 'fastify';
import { prisma } from '@chaya/shared';

const createPing = async () => {
  const ping = await prisma.ping.create({
    data: {},
  });
  console.log('Created Ping:', ping);
  return ping;
};

async function helloWorldRoutes(fastify: FastifyInstance) {
  fastify.get('/hello', async (request, reply) => {
    const ping = await createPing();
    return { hello: 'world', ping };
  });
}

export default helloWorldRoutes;
