export default function Loading() {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center">
        <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-28 h-8 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="rounded-md border">
        <div className="h-12 border-b bg-secondary px-4 flex items-center">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-32 mx-4 animate-pulse"></div>
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="border-b px-4 py-4 flex items-center">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="h-4 bg-gray-200 rounded w-32 mx-4 animate-pulse"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
