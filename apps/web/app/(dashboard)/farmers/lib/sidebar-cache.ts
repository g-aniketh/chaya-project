'use client';

import React from 'react';

const SIDEBAR_DATA_KEY = 'app_sidebar_data';
const SIDEBAR_TIMESTAMP_KEY = 'app_sidebar_timestamp';
const CACHE_TTL = 3600000; // 1 hour in milliseconds

export interface SidebarCacheItem {
  data: object;
  timestamp: number;
}

// Helper to check if we're in the browser
const isBrowser = typeof window !== 'undefined';

// Get sidebar data from cache
export function getSidebarCache<T>(): T | null {
  if (!isBrowser) return null;

  try {
    const cachedData = localStorage.getItem(SIDEBAR_DATA_KEY);
    const timestamp = localStorage.getItem(SIDEBAR_TIMESTAMP_KEY);

    if (!cachedData || !timestamp) return null;

    const parsedTimestamp = parseInt(timestamp);
    const now = Date.now();

    // Check if cache is still valid
    if (now - parsedTimestamp > CACHE_TTL) {
      clearSidebarCache();
      return null;
    }

    return JSON.parse(cachedData) as T;
  } catch (error) {
    console.error('Error reading sidebar cache:', error);
    return null;
  }
}

// Set sidebar data to cache
export function setSidebarCache<T>(data: T): void {
  if (!isBrowser) return;

  try {
    localStorage.setItem(SIDEBAR_DATA_KEY, JSON.stringify(data));
    localStorage.setItem(SIDEBAR_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error setting sidebar cache:', error);
  }
}

// Clear sidebar cache (used on logout)
export function clearSidebarCache(): void {
  if (!isBrowser) return;

  try {
    localStorage.removeItem(SIDEBAR_DATA_KEY);
    localStorage.removeItem(SIDEBAR_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Error clearing sidebar cache:', error);
  }
}

// Custom hook for sidebar cache
export function useSidebarCache<T>(fetchFn: () => Promise<T>) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    async function loadData() {
      setLoading(true);

      try {
        // Try to get data from cache first
        const cachedData = getSidebarCache<T>();

        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        // If no cache, fetch fresh data
        const freshData = await fetchFn();
        setData(freshData);

        // Cache the new data
        setSidebarCache(freshData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [fetchFn]);

  return { data, loading, error };
}
