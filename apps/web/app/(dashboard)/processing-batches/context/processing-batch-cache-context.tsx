'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ProcessingBatchWithSummary, ProcessingBatchWithDetails } from '../lib/types';
import { toast } from 'sonner';
import { getProcessingBatchDetailsById, getProcessingBatchesList } from '../lib/actions';

interface ProcessingBatchCacheContextType {
  processingBatchesSummary: Record<string, ProcessingBatchWithSummary[]>;
  totalPages: Record<string, number>;
  fetchProcessingBatchesSummary: (
    page: number,
    query: string,
    statusFilter: string
  ) => Promise<ProcessingBatchWithSummary[]>;
  fetchTotalPages: (query: string, statusFilter: string) => Promise<number>;
  clearCache: () => void;
  refreshCurrentPageSummary: (
    page: number,
    query: string,
    statusFilter: string
  ) => Promise<ProcessingBatchWithSummary[]>;
  getBatchDetails: (batchId: number) => Promise<ProcessingBatchWithDetails | null>;
  clearBatchDetailCache: (batchId: number) => void;
}

const ProcessingBatchCacheContext = createContext<ProcessingBatchCacheContextType | undefined>(undefined);

export function ProcessingBatchCacheProvider({ children }: { children: React.ReactNode }) {
  const [processingBatchesSummary, setProcessingBatchesSummary] = useState<
    Record<string, ProcessingBatchWithSummary[]>
  >({});
  const [totalPages, setTotalPages] = useState<Record<string, number>>({});
  const [batchDetailsCache, setBatchDetailsCache] = useState<Record<number, ProcessingBatchWithDetails>>({});

  const createListKey = useCallback((page: number, query: string, status: string) => `${query}:${status}:${page}`, []);

  const fetchProcessingBatchesSummary = useCallback(
    async (page: number, query: string, statusFilter: string): Promise<ProcessingBatchWithSummary[]> => {
      const key = createListKey(page, query, statusFilter);
      if (processingBatchesSummary[key]) {
        return processingBatchesSummary[key];
      }
      try {
        const data = await getProcessingBatchesList({ page, limit: 10, search: query, statusFilter });

        setProcessingBatchesSummary(prev => ({ ...prev, [key]: data.processingBatches }));
        setTotalPages(prev => ({ ...prev, [`${query}:${statusFilter}`]: data.pagination.totalPages }));
        return data.processingBatches;
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch processing batches summary.');
        throw error;
      }
    },
    [processingBatchesSummary, createListKey, setProcessingBatchesSummary, setTotalPages]
  );

  const fetchTotalPages = useCallback(
    async (query: string, statusFilter: string): Promise<number> => {
      const key = `${query}:${statusFilter}`;
      if (totalPages[key] !== undefined) {
        return totalPages[key];
      }
      try {
        const data = await getProcessingBatchesList({ page: 1, limit: 10, search: query, statusFilter });
        const pages = data.pagination.totalPages;
        setTotalPages(prev => ({ ...prev, [key]: pages }));
        return pages;
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch pagination data.');
        return 1;
      }
    },
    [totalPages, setTotalPages]
  );

  const refreshCurrentPageSummary = useCallback(
    async (page: number, query: string, statusFilter: string): Promise<ProcessingBatchWithSummary[]> => {
      const key = createListKey(page, query, statusFilter);
      try {
        const data = await getProcessingBatchesList({ page, limit: 10, search: query, statusFilter });

        setProcessingBatchesSummary(prev => ({ ...prev, [key]: data.processingBatches }));
        setTotalPages(prev => ({ ...prev, [`${query}:${statusFilter}`]: data.pagination.totalPages }));
        return data.processingBatches;
      } catch (error: any) {
        toast.error(error.message || `Failed to refresh batches data for page ${page}.`);
        throw error;
      }
    },
    [createListKey, setProcessingBatchesSummary, setTotalPages]
  );

  const getBatchDetails = useCallback(
    async (batchId: number): Promise<ProcessingBatchWithDetails | null> => {
      if (batchDetailsCache[batchId]) {
        return batchDetailsCache[batchId];
      }
      try {
        const batchData = await getProcessingBatchDetailsById(batchId);
        setBatchDetailsCache(prev => ({ ...prev, [batchId]: batchData }));
        return batchData;
      } catch (error: any) {
        toast.error(error.message || `Failed to fetch details for batch ID ${batchId}.`);
        return null;
      }
    },
    [batchDetailsCache, setBatchDetailsCache]
  );

  const clearBatchDetailCache = useCallback(
    (batchId: number) => {
      setBatchDetailsCache(prev => {
        const newState = { ...prev };
        delete newState[batchId];
        return newState;
      });
    },
    [setBatchDetailsCache]
  );

  const clearCache = useCallback(() => {
    setProcessingBatchesSummary({});
    setTotalPages({});
    setBatchDetailsCache({});
    toast.info('Processing batches cache cleared.');
  }, [setProcessingBatchesSummary, setTotalPages, setBatchDetailsCache]);

  return (
    <ProcessingBatchCacheContext.Provider
      value={{
        processingBatchesSummary,
        totalPages,
        fetchProcessingBatchesSummary,
        fetchTotalPages,
        clearCache,
        refreshCurrentPageSummary,
        getBatchDetails,
        clearBatchDetailCache,
      }}
    >
      {children}
    </ProcessingBatchCacheContext.Provider>
  );
}

export function useProcessingBatchCache() {
  const context = useContext(ProcessingBatchCacheContext);
  if (context === undefined) {
    throw new Error('useProcessingBatchCache must be used within a ProcessingBatchCacheProvider');
  }
  return context;
}
