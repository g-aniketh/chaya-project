'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { getProcurements, getProcurementPages } from '../lib/actions';
import { ProcurementWithRelations } from '../lib/types';
import { toast } from 'sonner';

interface ProcurementsCacheContextType {
  procurements: Record<string, ProcurementWithRelations[]>;
  totalPages: Record<string, number>;
  fetchProcurements: (page: number, query: string) => Promise<ProcurementWithRelations[]>;
  fetchTotalPages: (query: string) => Promise<number>;
  clearCache: () => void;
  prefetchPages: (startPage: number, endPage: number, query: string) => Promise<void>;
  refreshCurrentPage: (page: number, query: string) => Promise<ProcurementWithRelations[]>;
}

const ProcurementsCacheContext = createContext<ProcurementsCacheContextType | undefined>(undefined);

export function ProcurementsCacheProvider({ children }: { children: React.ReactNode }) {
  const [procurements, setProcurements] = useState<Record<string, ProcurementWithRelations[]>>({});
  const [totalPages, setTotalPages] = useState<Record<string, number>>({});

  const createKey = useCallback((page: number, query: string) => `${query}:${page}`, []);

  const fetchProcurements = useCallback(
    async (page: number, query: string): Promise<ProcurementWithRelations[]> => {
      const key = createKey(page, query);

      if (procurements[key]) {
        console.log(`Using cached data for page ${page}, query "${query}"`);
        return procurements[key];
      }

      console.log(`Fetching page ${page}, query "${query}" from server`);
      try {
        const data = (await getProcurements({ page, query })) as ProcurementWithRelations[];
        setProcurements(prev => ({
          ...prev,
          [key]: data,
        }));
        return data;
      } catch (error) {
        toast.error('Failed to fetch procurements data from server.');
        throw error;
      }
    },
    [procurements, createKey]
  );

  const fetchTotalPages = useCallback(
    async (query: string): Promise<number> => {
      if (totalPages[query] !== undefined) {
        return totalPages[query];
      }

      try {
        const pages = await getProcurementPages(query);
        setTotalPages(prev => ({
          ...prev,
          [query]: pages,
        }));
        return pages;
      } catch (error) {
        toast.error('Failed to fetch pagination data.');
        throw error;
      }
    },
    [totalPages]
  );

  const prefetchPages = useCallback(
    async (startPage: number, endPage: number, query: string) => {
      console.log(`Prefetching pages ${startPage}-${endPage} for query "${query}"`);

      for (let page = startPage; page <= endPage; page++) {
        const key = createKey(page, query);

        if (procurements[key]) continue;

        try {
          const data = (await getProcurements({
            page,
            query,
          })) as ProcurementWithRelations[];
          setProcurements(prev => ({
            ...prev,
            [key]: data,
          }));
        } catch (error) {
          console.error(`Error prefetching page ${page}:`, error);
          toast.error(`Failed to prefetch data for page ${page}.`);
        }
      }
    },
    [procurements, createKey]
  );

  const refreshCurrentPage = useCallback(
    async (page: number, query: string): Promise<ProcurementWithRelations[]> => {
      const key = createKey(page, query);

      console.log(`Force refreshing page ${page}, query "${query}" from server`);
      try {
        const data = (await getProcurements({
          page,
          query,
        })) as ProcurementWithRelations[];
        setProcurements(prev => ({
          ...prev,
          [key]: data,
        }));
        fetchTotalPages(query);
        return data;
      } catch (error) {
        console.error(`Error refreshing page ${page}:`, error);
        toast.error(`Failed to refresh data for page ${page}.`);
        throw error;
      }
    },
    [createKey, fetchTotalPages]
  );

  const clearCache = useCallback(() => {
    setProcurements({});
    setTotalPages({});
    toast.success('Cache cleared successfully.');
  }, []);

  const value = {
    procurements,
    totalPages,
    fetchProcurements,
    fetchTotalPages,
    clearCache,
    prefetchPages,
    refreshCurrentPage,
  };

  return <ProcurementsCacheContext.Provider value={value}>{children}</ProcurementsCacheContext.Provider>;
}

export function useProcurementsCache() {
  const context = useContext(ProcurementsCacheContext);

  if (context === undefined) {
    throw new Error('useProcurementsCache must be used within a ProcurementsCacheProvider');
  }

  return context;
}
