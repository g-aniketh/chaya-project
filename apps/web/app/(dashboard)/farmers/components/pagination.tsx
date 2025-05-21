'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { generatePagination } from '../lib/utils';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useFarmersCache } from '../context/farmer-cache-context';
import { toast } from 'sonner';

interface PaginationProps {
  query: string;
}

export default function Pagination({ query }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page') || 1);
  const { fetchTotalPages } = useFarmersCache();

  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTotalPages() {
      setLoading(true);
      try {
        const pages = await fetchTotalPages(query);
        setTotalPages(pages);
      } catch (error) {
        toast.error('Failed to load pagination data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadTotalPages();
  }, [fetchTotalPages, query]);

  const allPages = generatePagination(currentPage, totalPages);

  const createPageURL = (pageNumber: string | number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
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
    <div className="flex items-center justify-center gap-1 mt-8">
      <Button
        variant="outline"
        size="icon"
        className={clsx(currentPage <= 1 && 'opacity-50 cursor-not-allowed')}
        disabled={currentPage <= 1}
        asChild={currentPage > 1}
      >
        {currentPage > 1 ? (
          <Link href={createPageURL(currentPage - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <span>
            <ChevronLeft className="h-4 w-4" />
          </span>
        )}
      </Button>

      <div className="flex gap-1">
        {allPages.map((page, index) => {
          if (page === '...') {
            return (
              <Button key={`ellipsis-${index}`} variant="outline" size="icon" disabled className="cursor-default">
                ...
              </Button>
            );
          }

          const isCurrentPage = page === currentPage;

          return (
            <Button
              key={`page-${page}`}
              variant={isCurrentPage ? 'default' : 'outline'}
              size="icon"
              asChild={!isCurrentPage}
              className={clsx('h-9 w-9')}
            >
              {isCurrentPage ? <span>{page}</span> : <Link href={createPageURL(page)}>{page}</Link>}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="icon"
        className={clsx(currentPage >= totalPages && 'opacity-50 cursor-not-allowed')}
        disabled={currentPage >= totalPages}
        asChild={currentPage < totalPages}
      >
        {currentPage < totalPages ? (
          <Link href={createPageURL(currentPage + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </Button>
    </div>
  );
}
