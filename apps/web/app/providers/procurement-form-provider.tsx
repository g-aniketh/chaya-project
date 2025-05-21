'use client';

import React, { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useProcurementFormStore } from '../stores/procurement-form';
import type { ProcurementWithRelations } from '@/app/(dashboard)/procurements/lib/types';

interface ProcurementFormContextType {
  mode: 'add' | 'edit';
  initialData?: ProcurementWithRelations | null;
}

const ProcurementFormContext = createContext<ProcurementFormContextType | undefined>(undefined);

interface ProcurementFormProviderProps {
  children: ReactNode;
  initialData?: ProcurementWithRelations | null;
  mode: 'add' | 'edit';
}

export function ProcurementFormProvider({ children, initialData, mode }: ProcurementFormProviderProps) {
  const { initializeForm } = useProcurementFormStore();

  useEffect(() => {
    initializeForm(initialData, mode);
  }, [initialData, mode, initializeForm]);

  return <ProcurementFormContext.Provider value={{ mode, initialData }}>{children}</ProcurementFormContext.Provider>;
}

export function useProcurementFormContext() {
  const context = useContext(ProcurementFormContext);
  if (context === undefined) {
    throw new Error('useProcurementFormContext must be used within a ProcurementFormProvider');
  }
  return context;
}
