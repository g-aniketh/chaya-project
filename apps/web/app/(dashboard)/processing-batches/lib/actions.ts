'use server';

import { cookies } from 'next/headers';
import type { ProcessingBatchWithDetails, ProcessingBatchWithSummary } from './types';
import type { Drying, FinalizeProcessingStageInput } from '@chaya/shared';

const BACKEND_API_URL = process.env.API_URL || 'http://localhost:5000';

export async function getProcessingBatchDetailsById(batchId: number): Promise<ProcessingBatchWithDetails> {
  if (isNaN(batchId)) {
    throw new Error('Batch ID must be a valid number.');
  }
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      throw new Error('Authentication required');
    }

    const fetchURL = `${BACKEND_API_URL}/api/processing-batches/${batchId}`;
    const response = await fetch(fetchURL, {
      method: 'GET',
      headers: {
        Cookie: `token=${token}`,
      },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || `Failed to fetch processing batch ${batchId} from backend. Status: ${response.status}`
      );
    }
    return data as ProcessingBatchWithDetails;
  } catch (error: any) {
    console.error(`[Server Action Error] getProcessingBatchDetailsById(${batchId}):`, error.message);
    throw new Error(error.message || 'Internal server error in server action.');
  }
}

export async function getDryingEntriesForStage(stageId: number): Promise<Drying[]> {
  if (isNaN(stageId)) {
    throw new Error('Stage ID must be a valid number.');
  }
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${BACKEND_API_URL}/api/processing-stages/${stageId}/drying`, {
      method: 'GET',
      headers: { Cookie: `token=${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch drying entries');
    }
    return data.dryingEntries || [];
  } catch (error: any) {
    console.error(`[Server Action Error] getDryingEntriesForStage(${stageId}):`, error.message);
    throw new Error(error.message || 'Internal server error fetching drying entries.');
  }
}

export async function getProcessingBatchesList(params: {
  page: number;
  limit: number;
  search: string;
  statusFilter?: string;
}): Promise<{ processingBatches: ProcessingBatchWithSummary[]; pagination: any }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      throw new Error('Authentication required');
    }

    const searchParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
      search: params.search,
    });
    if (params.statusFilter) {
      searchParams.set('status', params.statusFilter);
    }

    const response = await fetch(`${BACKEND_API_URL}/api/processing-batches?${searchParams.toString()}`, {
      method: 'GET',
      headers: { Cookie: `token=${token}` },
      cache: 'no-store',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch processing batches list from backend');
    }
    return data;
  } catch (error: any) {
    console.error('[Server Action Error] getProcessingBatchesList:', error.message);
    throw new Error(error.message || 'Internal server error fetching processing batches list.');
  }
}

export async function finalizeProcessingStageAction(
  stageId: number,
  payload: FinalizeProcessingStageInput
): Promise<any> {
  if (isNaN(stageId)) {
    throw new Error('Stage ID must be a valid number.');
  }
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${BACKEND_API_URL}/api/processing-stages/${stageId}/finalize`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Failed to finalize stage ${stageId}`);
    }
    return data;
  } catch (error: any) {
    console.error(`[Server Action Error] finalizeProcessingStageAction(${stageId}):`, error.message);
    throw new Error(error.message || 'Internal server error finalizing stage.');
  }
}

export async function deleteProcessingBatchAction(
  batchId: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (isNaN(batchId)) {
    return { success: false, error: 'Invalid Batch ID.' };
  }
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    const response = await fetch(`${BACKEND_API_URL}/api/processing-batches/${batchId}`, {
      method: 'DELETE',
      headers: { Cookie: `token=${token}` },
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || `Failed to delete processing batch ${batchId}` };
    }
    return { success: true, message: data.message };
  } catch (error: any) {
    console.error(`[Server Action Error] deleteProcessingBatchAction(${batchId}):`, error.message);
    return { success: false, error: error.message || 'Internal server error deleting batch.' };
  }
}

export async function bulkDeleteProcessingBatchesAction(
  batchIds: number[]
): Promise<{ success: boolean; message?: string; deletedCount?: number; errors?: any[] }> {
  if (!Array.isArray(batchIds) || batchIds.some(isNaN)) {
    console.log('Invalid Batch IDs provided.');
    return { success: false };
  }
  if (batchIds.length === 0) {
    return { success: true, message: 'No batches selected for deletion.' };
  }
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      console.log('Authentication required');
      return { success: false };
    }

    const response = await fetch(`${BACKEND_API_URL}/api/processing-batches/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({ ids: batchIds }),
    });

    const data = await response.json();
    if (!response.ok && response.status !== 207) {
      console.log('Failed to bulk delete processing batches');
      return { success: false };
    }
    return { success: response.ok, ...data };
  } catch (error: any) {
    console.error('[Server Action Error] bulkDeleteProcessingBatchesAction:', error.message);
    return { success: false };
  }
}
