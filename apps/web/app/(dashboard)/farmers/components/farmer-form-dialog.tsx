'use client';

import { FarmerFormProvider } from '@/app/providers/farmer-form-provider';
import { FarmerWithRelations } from '../lib/types';
import { FarmerForm } from '@/app/components/farmer-form/farmer-form';
import { useEffect } from 'react';

interface FarmerFormDialogProps {
  mode: 'add' | 'edit';
  farmer?: FarmerWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FarmerFormDialog({ mode, farmer, open, onOpenChange }: FarmerFormDialogProps) {
  const handleFormSuccess = () => {
    const dataChangedEvent = new CustomEvent('farmerDataChanged');
    document.dispatchEvent(dataChangedEvent);
  };

  useEffect(() => {
    const handleFormSubmitSuccess = () => {
      handleFormSuccess();
    };
    document.addEventListener('farmerFormSubmitSuccess', handleFormSubmitSuccess);
    return () => {
      document.removeEventListener('farmerFormSubmitSuccess', handleFormSubmitSuccess);
    };
  }, []);

  return (
    <FarmerFormProvider initialData={farmer} mode={mode}>
      <FarmerForm mode={mode} open={open} onOpenChange={onOpenChange} farmerId={farmer?.id} />
    </FarmerFormProvider>
  );
}
