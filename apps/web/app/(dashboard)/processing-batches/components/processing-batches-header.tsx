'use client';

import { Button } from '@workspace/ui/components/button';
import { FileDown, PlusCircle } from 'lucide-react';
import { useAuth } from '@/app/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ProcessingBatchesHeader() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const router = useRouter();

  const handleExport = () => {
    // TODO: Implement export functionality for processing batches
    console.log('Export processing batches data clicked');
    toast.info('Export functionality for processing batches is not yet implemented.');
  };

  const handleAddBatch = () => {
    router.push('/processing-batches/add');
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Processing Batches</h1>
        <p className="text-gray-600">Manage and track multi-stage crop processing batches.</p>
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9">
            <FileDown className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        )}
        <Button size="sm" onClick={handleAddBatch} className="h-9 bg-green-500 text-white hover:bg-green-600">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Processing Batch
        </Button>
      </div>
    </div>
  );
}
