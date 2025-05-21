import { prisma } from '@chaya/shared';

export const ITEMS_PER_PAGE = 10;

import { FarmerWithRelations } from './types';
//selectedColumns is not used in the function, but it is included in the function signature for future use
export async function getFarmers({
  query = '',
  page = 1,
}: {
  query?: string;
  page?: number;
  selectedColumns?: string[];
}): Promise<FarmerWithRelations[]> {
  const offset = (page - 1) * ITEMS_PER_PAGE;

  try {
    const farmers = await prisma.farmer.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { aadharNumber: { contains: query, mode: 'insensitive' } },
          { surveyNumber: { contains: query, mode: 'insensitive' } },
          { contactNumber: { contains: query, mode: 'insensitive' } },
          { village: { contains: query, mode: 'insensitive' } },
          { district: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        bankDetails: true,
        documents: true,
        fields: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      take: ITEMS_PER_PAGE,
      skip: offset,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return farmers as FarmerWithRelations[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch farmers.');
  }
}
// Count total farmers matching the query

export async function getFarmerPages(query: string) {
  try {
    const count = await prisma.farmer.count({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { aadharNumber: { contains: query, mode: 'insensitive' } },
          { surveyNumber: { contains: query, mode: 'insensitive' } },
          { contactNumber: { contains: query, mode: 'insensitive' } },
          { village: { contains: query, mode: 'insensitive' } },
          { district: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of farmers.');
  }
}
