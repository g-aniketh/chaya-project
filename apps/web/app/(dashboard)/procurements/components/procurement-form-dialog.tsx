'use client';

import { ProcurementFormProvider } from '@/app/providers/procurement-form-provider';
import type { ProcurementWithRelations } from '../lib/types';
import { ProcurementForm } from '@/app/components/procurement-form/procurement-form';

interface ProcurementFormDialogProps {
  mode: 'add' | 'edit';
  procurement?: ProcurementWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProcurementFormDialog({ mode, procurement, open, onOpenChange }: ProcurementFormDialogProps) {
  return (
    <ProcurementFormProvider initialData={procurement} mode={mode}>
      <ProcurementForm mode={mode} open={open} onOpenChange={onOpenChange} procurementId={procurement?.id} />
    </ProcurementFormProvider>
  );
}
