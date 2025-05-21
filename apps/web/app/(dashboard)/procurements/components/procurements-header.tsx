'use client';

import { Button } from '@workspace/ui/components/button';
import { FileDown, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { ProcurementFormDialog } from './procurement-form-dialog';
import { useAuth } from '@/app/providers/auth-provider';

export default function ProcurementsHeader() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleExport = () => {
    console.log('Export data clicked');
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Procurement Dashboard</h1>
        <p className="text-gray-600">Manage and track crop procurements</p>
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 bg-purple-500 text-white hover:bg-purple-600 hover:text-white"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        )}

        <Button
          size="sm"
          onClick={() => setShowAddDialog(true)}
          className="h-9 bg-green-500 text-white hover:bg-green-600"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Procurement
        </Button>

        <ProcurementFormDialog mode="add" open={showAddDialog} onOpenChange={setShowAddDialog} />
      </div>
    </div>
  );
}
