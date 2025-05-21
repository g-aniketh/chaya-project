'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@workspace/ui/components/input';
import { useEffect, useState } from 'react';
import { useDebounce } from '@/app/hooks/use-debounce';

interface SearchProps {
  placeholder?: string;
}

export default function Search({ placeholder }: SearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (debouncedSearchTerm) {
      params.set('query', debouncedSearchTerm);
    } else {
      params.delete('query');
    }

    params.set('page', '1'); // Reset to first page on search
    // router.push(`?${params.toString()}`);
  }, [debouncedSearchTerm, router, searchParams]);

  return (
    <div className="relative w-full md:w-80">
      <Input
        placeholder={placeholder || 'Search...'}
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full"
      />
    </div>
  );
}
