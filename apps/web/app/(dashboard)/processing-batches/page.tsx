import { Suspense } from 'react';
import ProcessingBatchesHeader from './components/processing-batches-header';
import Search from './components/search';
import ProcessingBatchesTable from './components/processing-batches-table';
import Pagination from './components/pagination';
import Loading from './loading';
import { ProcessingBatchCacheProvider } from './context/processing-batch-cache-context';

interface PageProps {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    status?: string; // For filtering by latest stage status
  }>;
}

export default async function ProcessingBatchesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params?.query || '';
  const currentPage = Number(params?.page) || 1;
  const status = params?.status || '';

  return (
    <ProcessingBatchCacheProvider>
      <div className="space-y-6 p-4">
        <ProcessingBatchesHeader />

        <div className="flex items-center justify-between gap-2">
          <Search placeholder="Search by Batch Code, Crop..." />
        </div>
        <Suspense key={query + currentPage.toString() + status} fallback={<Loading />}>
          <ProcessingBatchesTable query={query} currentPage={currentPage} statusFilter={status} />
          <Pagination query={query} statusFilter={status} />
        </Suspense>
      </div>
    </ProcessingBatchCacheProvider>
  );
}
