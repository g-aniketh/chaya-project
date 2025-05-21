import { Suspense } from 'react';
import ProcurementsHeader from './components/procurements-header';
import Search from './components/search';
import ProcurementsTable from './components/procurements-table';
import Pagination from './components/pagination';
import Loading from './loading';
import { ProcurementsCacheProvider } from './context/procurement-cache-context';

interface PageProps {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}

export default async function ProcurementsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params?.query || '';
  const currentPage = Number(params?.page) || 1;

  return (
    <ProcurementsCacheProvider>
      <div className="space-y-6 p-4">
        <ProcurementsHeader />

        <div className="flex items-center justify-between gap-2">
          <Search placeholder="Enter Proc. No., crop, farmer name" />
        </div>

        <Suspense key={query + currentPage.toString()} fallback={<Loading />}>
          <ProcurementsTableWithCache query={query} currentPage={currentPage} />
        </Suspense>
      </div>
    </ProcurementsCacheProvider>
  );
}

async function ProcurementsTableWithCache({ query, currentPage }: { query: string; currentPage: number }) {
  return (
    <>
      <ProcurementsTable query={query} currentPage={currentPage} />
      <PaginationWithCache query={query} />
    </>
  );
}

async function PaginationWithCache({ query }: { query: string }) {
  return <Pagination query={query} />;
}
