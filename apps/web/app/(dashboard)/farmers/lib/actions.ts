'use server';

import { revalidatePath } from 'next/cache';
import { Gender, Relationship, prisma } from '@chaya/shared';
import { ITEMS_PER_PAGE } from './constants';

interface FarmerFormData {
  surveyNumber: string;
  name: string;
  relationship: Relationship;
  gender: Gender;
  community: string;
  aadharNumber: string;
  state: string;
  district: string;
  mandal: string;
  village: string;
  panchayath: string;
  dateOfBirth: string;
  age: number;
  contactNumber: string;
  bankDetails?: {
    ifscCode: string;
    bankName: string;
    branchName: string;
    accountNumber: string;
    address: string;
    bankCode: string;
  };
  documents?: {
    profilePicUrl: string;
    aadharDocUrl: string;
    bankDocUrl: string;
  };
  fields?: {
    areaHa: number;
    yieldEstimate: number;
    location: Record<string, any>;
    landDocumentUrl: string;
  }[];
}

export async function createFarmer(userId: number, formData: FarmerFormData) {
  try {
    const { bankDetails, documents, fields, ...farmerData } = formData;
    const dateOfBirth = new Date(farmerData.dateOfBirth);

    await prisma.farmer.create({
      data: {
        ...farmerData,
        dateOfBirth,
        createdById: userId,
        updatedById: userId,
        ...(bankDetails && {
          bankDetails: {
            create: bankDetails,
          },
        }),
        ...(documents && {
          documents: {
            create: documents,
          },
        }),
        ...(fields && {
          fields: {
            create: fields,
          },
        }),
      },
    });

    revalidatePath('/dashboard/farmers');
    return { success: true };
  } catch (error) {
    console.error('Failed to create farmer:', error);
    return { error: 'Failed to create farmer. Please try again.' };
  }
}

export async function updateFarmer(userId: number, farmerId: number, formData: Partial<FarmerFormData>) {
  try {
    const { bankDetails, documents, fields, ...farmerData } = formData;
    const dateOfBirth = farmerData.dateOfBirth ? new Date(farmerData.dateOfBirth) : undefined;

    await prisma.farmer.update({
      where: { id: farmerId },
      data: {
        ...farmerData,
        ...(dateOfBirth && { dateOfBirth }),
        updatedById: userId,
        ...(bankDetails && {
          bankDetails: {
            upsert: {
              create: bankDetails,
              update: bankDetails,
            },
          },
        }),
        ...(documents && {
          documents: {
            upsert: {
              create: documents,
              update: documents,
            },
          },
        }),
      },
    });

    revalidatePath('/dashboard/farmers');
    return { success: true };
  } catch (error) {
    console.error('Failed to update farmer:', error);
    return { error: 'Failed to update farmer. Please try again.' };
  }
}

export async function deleteFarmer(farmerId: number) {
  try {
    await prisma.farmer.delete({
      where: { id: farmerId },
    });

    revalidatePath('/dashboard/farmers');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete farmer:', error);
    return { error: 'Failed to delete farmer. Please try again.' };
  }
}

export async function bulkDeleteFarmers(farmerIds: number[]) {
  try {
    await prisma.farmer.deleteMany({
      where: {
        id: { in: farmerIds },
      },
    });

    revalidatePath('/dashboard/farmers');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete farmers:', error);
    return { error: 'Failed to delete farmers. Please try again.' };
  }
}

export async function exportFarmersData(query?: string) {
  try {
    const farmers = await prisma.farmer.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { aadharNumber: { contains: query, mode: 'insensitive' } },
              { surveyNumber: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        bankDetails: true,
        fields: true,
      },
    });

    return {
      success: true,
      count: farmers.length,
      downloadUrl: `/api/export/farmers?timestamp=${Date.now()}`,
    };
  } catch (error) {
    console.error('Failed to export farmers data:', error);
    return { error: 'Failed to export farmers data. Please try again.' };
  }
}
//SelectedColumns is not used in the function, but it's included in the function signature for future use just adding for reference
export async function getFarmers({
  query = '',
  page = 1,
}: {
  query?: string;
  page?: number;
  selectedColumns?: string[];
}) {
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

    return farmers;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch farmers.');
  }
}

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
