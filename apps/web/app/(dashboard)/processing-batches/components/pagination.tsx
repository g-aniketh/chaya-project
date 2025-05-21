'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useProcessingBatchCache } from '../context/processing-batch-cache-context';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PaginationProps {
  query: string;
  statusFilter: string;
}

export default function Pagination({ query, statusFilter }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchTotalPages } = useProcessingBatchCache();

  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const currentPage = Number(searchParams.get('page') || '1');

  useEffect(() => {
    async function loadTotalPages() {
      setLoading(true);
      try {
        const pages = await fetchTotalPages(query, statusFilter);
        setTotalPages(pages);
      } catch (error) {
        toast.error('Failed to load pagination data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadTotalPages();
  }, [fetchTotalPages, query, statusFilter]);

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `?${params.toString()}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-8 space-x-2">
        <div className="h-10 w-10 rounded-md bg-gray-200 animate-pulse"></div>
        <div className="h-10 w-10 rounded-md bg-gray-200 animate-pulse"></div>
        <div className="h-10 w-10 rounded-md bg-gray-200 animate-pulse"></div>
      </div>
    );
  }

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-2 mt-4">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => router.push(createPageURL(1))} disabled={currentPage <= 1}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(createPageURL(currentPage - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(createPageURL(currentPage + 1))}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(createPageURL(totalPages))}
          disabled={currentPage >= totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
