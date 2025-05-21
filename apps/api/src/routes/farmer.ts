import type { FastifyInstance } from 'fastify';
import { prisma } from '@chaya/shared';
import { authenticate, verifyAdmin, type AuthenticatedRequest } from '../middlewares/auth';
import { createFarmerSchema, updateFarmerSchema, farmerQuerySchema } from '@chaya/shared';
import { Prisma } from '@chaya/shared';
import { generateSurveyNumber } from '../helper';
import redisClient from '../lib/redis';

const FARMER_DETAIL_CACHE_PREFIX = 'farmers:';
const FARMER_LIST_CACHE_PREFIX = 'farmers:list:';
const CACHE_TTL_SECONDS = 3600;

async function invalidateFarmerCache(farmerId?: number | string) {
  const keysToDelete: string[] = [];
  if (farmerId) {
    keysToDelete.push(`${FARMER_DETAIL_CACHE_PREFIX}${farmerId}`);
  }
  const listKeys = await redisClient.keys(`${FARMER_LIST_CACHE_PREFIX}*`);
  if (listKeys.length > 0) {
    keysToDelete.push(...listKeys);
  }

  if (keysToDelete.length > 0) {
    try {
      await redisClient.del(keysToDelete);
      console.log(`Invalidated farmer cache for: ${keysToDelete.join(', ')}`);
    } catch (e) {
      console.error('Redis DEL error (farmer cache):', e);
    }
  }
}

async function farmerRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    const query = farmerQuerySchema.parse(request.query);
    const cacheKey = `${FARMER_LIST_CACHE_PREFIX}${JSON.stringify(query)}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`Cache hit for ${cacheKey}`);
        return JSON.parse(cached);
      }
      console.log(`Cache miss for ${cacheKey}`);
    } catch (e) {
      console.error(`Redis GET error (${cacheKey}):`, e);
    }

    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const where: Prisma.FarmerWhereInput = {
        isActive: query.isActive,
      };

      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { surveyNumber: { contains: query.search, mode: 'insensitive' } },
          { aadharNumber: { contains: query.search, mode: 'insensitive' } },
          { contactNumber: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      if (query.state) where.state = query.state;
      if (query.district) where.district = query.district;
      if (query.gender) where.gender = query.gender;

      const [farmers, totalCount] = await Promise.all([
        prisma.farmer.findMany({
          where,
          include: {
            documents: true,
            bankDetails: true,
            fields: true,
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.farmer.count({ where }),
      ]);

      const result = {
        farmers,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
      try {
        await redisClient.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL_SECONDS);
      } catch (e) {
        console.error(`Redis SET error (${cacheKey}):`, e);
      }
    } catch (error: any) {
      if (error.issues) return reply.status(400).send({ error: 'Invalid query parameters', details: error.issues });
      console.error('DB error fetching farmers list:', error);
      return reply.status(500).send({ error: 'Server error fetching farmers' });
    }
  });

  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const farmerId = parseInt(id);
    if (isNaN(farmerId)) return reply.status(400).send({ error: 'Invalid Farmer ID' });

    const cacheKey = `${FARMER_DETAIL_CACHE_PREFIX}${farmerId}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`Cache hit for ${cacheKey}`);
        return { farmer: JSON.parse(cached) };
      }
      console.log(`Cache miss for ${cacheKey}`);
    } catch (e) {
      console.error(`Redis GET error (${cacheKey}):`, e);
    }

    try {
      const farmer = await prisma.farmer.findUnique({
        where: { id: parseInt(id) },
        include: {
          documents: true,
          bankDetails: true,
          fields: true,
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!farmer) {
        return reply.status(404).send({ error: 'Farmer not found' });
      }
      try {
        await redisClient.set(cacheKey, JSON.stringify(farmer), 'EX', CACHE_TTL_SECONDS);
      } catch (e) {
        console.error(`Redis SET error (${cacheKey}):`, e);
      }
      return { farmer };
    } catch (error) {
      console.error(`DB error fetching farmer ${farmerId}:`, error);
      return reply.status(500).send({ error: 'Server error fetching farmer details' });
    }
  });

  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { farmer, bankDetails, documents, fields } = createFarmerSchema.parse(request.body);

      const existingFarmer = await prisma.farmer.findFirst({
        where: {
          OR: [{ surveyNumber: farmer.surveyNumber }, { aadharNumber: farmer.aadharNumber }],
        },
      });

      if (existingFarmer) {
        return reply.status(400).send({
          error: 'A farmer with this survey number or Aadhar number already exists',
        });
      }
      const surveyNumber = await generateSurveyNumber();
      const newFarmer = await prisma.farmer.create({
        data: {
          ...farmer,
          surveyNumber,
          createdById: authRequest.user.id,
          updatedById: authRequest.user.id,
          bankDetails: {
            create: bankDetails,
          },
          documents: {
            create: documents,
          },
          fields: {
            create: fields || [],
          },
        },
        include: {
          bankDetails: true,
          documents: true,
          fields: true,
        },
      });

      await invalidateFarmerCache();
      return reply.status(201).send({ farmer: newFarmer });
    } catch (error: any) {
      if (error.issues) return reply.status(400).send({ error: 'Invalid request data', details: error.issues });
      console.error('DB/Validation error creating farmer:', error);
      return reply.status(500).send({ error: 'Server error creating farmer' });
    }
  });

  fastify.put('/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const farmerId = parseInt(id);
    if (isNaN(farmerId)) return reply.status(400).send({ error: 'Invalid Farmer ID' });

    try {
      const authRequest = request as AuthenticatedRequest;
      const updateData = updateFarmerSchema.parse(request.body);

      const existingFarmer = await prisma.farmer.findUnique({
        where: { id: parseInt(id) },
        include: {
          bankDetails: true,
          documents: true,
          fields: true,
        },
      });

      if (!existingFarmer) {
        return reply.status(404).send({ error: 'Farmer not found' });
      }

      const updatedFarmer = await prisma.$transaction(async tx => {
        const farmer = await tx.farmer.update({
          where: { id: parseInt(id) },
          data: {
            ...updateData.farmer,
            updatedById: authRequest.user.id,
          },
        });

        if (updateData.bankDetails && existingFarmer.bankDetails) {
          await tx.bankDetails.update({
            where: { farmerId: farmer.id },
            data: updateData.bankDetails,
          });
        } else if (updateData.bankDetails && !existingFarmer.bankDetails) {
          if (
            !updateData.bankDetails.ifscCode ||
            !updateData.bankDetails.bankName ||
            !updateData.bankDetails.branchName ||
            !updateData.bankDetails.accountNumber ||
            !updateData.bankDetails.address ||
            !updateData.bankDetails.bankCode
          ) {
            throw new Error('All bank details fields are required when creating new bank details');
          }
          await tx.bankDetails.create({
            data: {
              ifscCode: updateData.bankDetails.ifscCode,
              bankName: updateData.bankDetails.bankName,
              branchName: updateData.bankDetails.branchName,
              accountNumber: updateData.bankDetails.accountNumber,
              address: updateData.bankDetails.address,
              bankCode: updateData.bankDetails.bankCode,
              farmerId: farmer.id,
            },
          });
        }

        if (updateData.documents && existingFarmer.documents) {
          await tx.farmerDocuments.update({
            where: { farmerId: farmer.id },
            data: updateData.documents,
          });
        } else if (updateData.documents && !existingFarmer.documents) {
          if (
            !updateData.documents.profilePicUrl ||
            !updateData.documents.aadharDocUrl ||
            !updateData.documents.bankDocUrl
          ) {
            throw new Error('All document URLs are required when creating new documents');
          }
          await tx.farmerDocuments.create({
            data: {
              profilePicUrl: updateData.documents.profilePicUrl,
              aadharDocUrl: updateData.documents.aadharDocUrl,
              bankDocUrl: updateData.documents.bankDocUrl,
              farmerId: farmer.id,
            },
          });
        }

        if (updateData.fields?.length) {
          const invalidFields = updateData.fields.filter(
            field => !field.areaHa || !field.yieldEstimate || !field.location || !field.landDocumentUrl
          );
          if (invalidFields.length > 0) {
            throw new Error('All field properties are required when creating new fields');
          }
          await tx.field.deleteMany({
            where: { farmerId: farmer.id },
          });
          await tx.field.createMany({
            data: updateData.fields.map(field => ({
              areaHa: field.areaHa!,
              yieldEstimate: field.yieldEstimate!,
              location: field.location!,
              landDocumentUrl: field.landDocumentUrl!,
              farmerId: farmer.id,
            })),
          });
        }

        return tx.farmer.findUnique({
          where: { id: farmer.id },
          include: {
            bankDetails: true,
            documents: true,
            fields: true,
          },
        });
      });

      await invalidateFarmerCache(farmerId);
      return { farmer: updatedFarmer };
    } catch (error: any) {
      if (error.issues) return reply.status(400).send({ error: 'Invalid request data', details: error.issues });
      console.error(`DB/Validation error updating farmer ${farmerId}:`, error);
      if (error instanceof Error && error.message.includes('required')) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Server error updating farmer' });
    }
  });

  fastify.patch('/:id/toggle-status', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const farmerId = parseInt(id);
    if (isNaN(farmerId)) return reply.status(400).send({ error: 'Invalid Farmer ID' });
    try {
      const authRequest = request as AuthenticatedRequest;

      const farmer = await prisma.farmer.findUnique({
        where: { id: parseInt(id) },
      });

      if (!farmer) {
        return reply.status(404).send({ error: 'Farmer not found' });
      }

      const updatedFarmer = await prisma.farmer.update({
        where: { id: parseInt(id) },
        data: {
          isActive: !farmer.isActive,
          updatedById: authRequest.user.id,
        },
        include: {
          bankDetails: true,
          documents: true,
        },
      });

      await invalidateFarmerCache(farmerId);
      return { farmer: updatedFarmer };
    } catch (error) {
      console.error(`DB error toggling status for farmer ${farmerId}:`, error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  fastify.delete('/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const farmerId = parseInt(id);
    if (isNaN(farmerId)) return reply.status(400).send({ error: 'Invalid Farmer ID' });

    try {
      const farmer = await prisma.farmer.findUnique({
        where: { id: parseInt(id) },
      });

      if (!farmer) {
        return reply.status(404).send({ error: 'Farmer not found' });
      }

      await prisma.farmer.delete({
        where: { id: parseInt(id) },
      });

      await invalidateFarmerCache(farmerId);
      return { success: true };
    } catch (error) {
      console.error(`DB error deleting farmer ${farmerId}:`, error);
      return reply.status(500).send({ error: 'Server error' });
    }
  });

  fastify.get('/export', { preHandler: authenticate }, async (request, reply) => {
    try {
      const query = farmerQuerySchema.parse(request.query);

      const where: Prisma.FarmerWhereInput = {
        isActive: query.isActive,
      };

      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { surveyNumber: { contains: query.search, mode: 'insensitive' } },
          { aadharNumber: { contains: query.search, mode: 'insensitive' } },
          { contactNumber: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      if (query.state) where.state = query.state;
      if (query.district) where.district = query.district;
      if (query.gender) where.gender = query.gender;

      const limit = query.limit || 1000;

      const farmers = await prisma.farmer.findMany({
        where,
        include: {
          bankDetails: true,
        },
        orderBy: { name: 'asc' },
        take: limit,
      });

      const csvData = farmers.map(farmer => ({
        ID: farmer.id,
        SurveyNumber: farmer.surveyNumber,
        Name: farmer.name,
        Gender: farmer.gender,
        Community: farmer.community,
        AadharNumber: farmer.aadharNumber,
        State: farmer.state,
        District: farmer.district,
        Mandal: farmer.mandal,
        Village: farmer.village,
        Panchayath: farmer.panchayath,
        DateOfBirth: farmer.dateOfBirth.toISOString().split('T')[0],
        Age: farmer.age,
        ContactNumber: farmer.contactNumber,
        BankName: farmer.bankDetails?.bankName || '',
        BranchName: farmer.bankDetails?.branchName || '',
        AccountNumber: farmer.bankDetails?.accountNumber || '',
        IFSC: farmer.bankDetails?.ifscCode || '',
      }));

      const headers = Object.keys(csvData[0] || {}).join(',');

      const rows = csvData.map(row => {
        return Object.values(row)
          .map(value => {
            if (typeof value === 'string') {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',');
      });

      const csv = [headers, ...rows].join('\n');

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', 'attachment; filename=farmers.csv');

      return csv;
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid query parameters' });
    }
  });
}

export default farmerRoutes;
