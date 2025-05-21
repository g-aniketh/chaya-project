import { Suspense } from 'react';
import FarmersHeader from './components/farmers-header';
import Search from './components/search';
import FarmersTable from './components/farmers-table';
import Pagination from './components/pagination';
import Loading from './loading';
import { FarmersCacheProvider } from './context/farmer-cache-context';

interface PageProps {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}

export default async function FarmersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params?.query || '';
  const currentPage = Number(params?.page) || 1;

  return (
    <FarmersCacheProvider>
      <div className="space-y-6 p-4">
        <FarmersHeader />

        <div className="flex items-center justify-between gap-2">
          <Search placeholder="Enter farmer name, batch code, village" />
        </div>

        <Suspense key={query + currentPage.toString()} fallback={<Loading />}>
          <FarmersTableWithCache query={query} currentPage={currentPage} />
        </Suspense>
      </div>
    </FarmersCacheProvider>
  );
}

async function FarmersTableWithCache({ query, currentPage }: { query: string; currentPage: number }) {
  return (
    <>
      <FarmersTable query={query} currentPage={currentPage} />
      <PaginationWithCache query={query} />
    </>
  );
}

async function PaginationWithCache({ query }: { query: string }) {
  return <Pagination query={query} />;
}
