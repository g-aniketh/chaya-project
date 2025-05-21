'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { getFarmers, getFarmerPages } from '../lib/actions';
import { FarmerWithRelations } from '../lib/types';
import { toast } from 'sonner';

interface FarmersCacheContextType {
  farmers: Record<string, FarmerWithRelations[]>;
  totalPages: Record<string, number>;
  fetchFarmers: (page: number, query: string) => Promise<FarmerWithRelations[]>;
  fetchTotalPages: (query: string) => Promise<number>;
  clearCache: () => void;
  prefetchPages: (startPage: number, endPage: number, query: string) => Promise<void>;
  refreshCurrentPage: (page: number, query: string) => Promise<FarmerWithRelations[]>;
}

const FarmersCacheContext = createContext<FarmersCacheContextType | undefined>(undefined);

export function FarmersCacheProvider({ children }: { children: React.ReactNode }) {
  const [farmers, setFarmers] = useState<Record<string, FarmerWithRelations[]>>({});
  const [totalPages, setTotalPages] = useState<Record<string, number>>({});

  const createKey = useCallback((page: number, query: string) => `${query}:${page}`, []);

  const fetchFarmers = useCallback(
    async (page: number, query: string): Promise<FarmerWithRelations[]> => {
      const key = createKey(page, query);

      if (farmers[key]) {
        console.log(`Using cached data for page ${page}, query "${query}"`);
        return farmers[key];
      }

      console.log(`Fetching page ${page}, query "${query}" from server`);
      try {
        const data = (await getFarmers({ page, query })) as FarmerWithRelations[];
        setFarmers(prev => ({
          ...prev,
          [key]: data,
        }));
        return data;
      } catch (error) {
        toast.error('Failed to fetch farmers data from server.');
        throw error;
      }
    },
    [farmers, createKey]
  );

  const fetchTotalPages = useCallback(
    async (query: string): Promise<number> => {
      if (totalPages[query] !== undefined) {
        return totalPages[query];
      }

      try {
        const pages = await getFarmerPages(query);
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

        if (farmers[key]) continue;

        try {
          const data = (await getFarmers({
            page,
            query,
          })) as FarmerWithRelations[];
          setFarmers(prev => ({
            ...prev,
            [key]: data,
          }));
        } catch (error) {
          console.error(`Error prefetching page ${page}:`, error);
          toast.error(`Failed to prefetch data for page ${page}.`);
        }
      }
    },
    [farmers, createKey]
  );

  const refreshCurrentPage = useCallback(
    async (page: number, query: string): Promise<FarmerWithRelations[]> => {
      const key = createKey(page, query);

      console.log(`Force refreshing page ${page}, query "${query}" from server`);
      try {
        const data = (await getFarmers({
          page,
          query,
        })) as FarmerWithRelations[];
        setFarmers(prev => ({
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
    setFarmers({});
    setTotalPages({});
    toast.success('Cache cleared successfully.');
  }, []);

  const value = {
    farmers,
    totalPages,
    fetchFarmers,
    fetchTotalPages,
    clearCache,
    prefetchPages,
    refreshCurrentPage,
  };

  return <FarmersCacheContext.Provider value={value}>{children}</FarmersCacheContext.Provider>;
}

export function useFarmersCache() {
  const context = useContext(FarmersCacheContext);

  if (context === undefined) {
    throw new Error('useFarmersCache must be used within a FarmersCacheProvider');
  }

  return context;
}
