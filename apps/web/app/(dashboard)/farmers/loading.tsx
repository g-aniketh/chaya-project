import { Skeleton } from '@workspace/ui/components/skeleton';

export default function Loading() {
  return (
    <div className="w-full">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Search skeleton */}
      <div className="mt-6 flex items-center justify-between gap-2">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Table skeleton */}
      <div className="mt-6 space-y-4">
        <div className="rounded-md border">
          <div className="h-12 border-b bg-secondary px-4">
            <div className="flex h-full items-center">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-40 mx-4" />
              ))}
            </div>
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="border-b px-4 py-4">
              <div className="flex items-center">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-40 mx-4" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="mt-8 flex items-center justify-center gap-1">
        <Skeleton className="h-9 w-9" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-9 mx-1" />
        ))}
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  );
}
