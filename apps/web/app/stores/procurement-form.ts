import { create } from 'zustand';
import type { UseFormReturn } from 'react-hook-form';
import type { ProcurementWithRelations } from '@/app/(dashboard)/procurements/lib/types';
import { z } from 'zod';
import { toast } from 'sonner';

const basicInfoSchemaForStore = z.object({
  farmerId: z.number({ required_error: 'Farmer is required' }),
  crop: z.string().min(1, 'Crop is required'),
  procuredForm: z.string().min(1, 'Procured form is required'),
  speciality: z.string().min(1, 'Speciality is required'),
  quantity: z
    .number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' })
    .positive('Quantity must be a positive number'),
});
const detailsSchemaForStore = z.object({
  date: z.date({ required_error: 'Date is required' }),
  time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid time format (expected HH:mm:ss)'),
  lotNo: z
    .number({ required_error: 'Lot number is required', invalid_type_error: 'Lot number must be a number' })
    .int()
    .min(1)
    .max(3, 'Only 1, 2, 3 Lot Numbers are allowed'),
  procuredBy: z.string().min(1, 'Procured by is required'),
  vehicleNo: z.string().min(1, 'Vehicle number is required'),
});

export const procurementFullFormSchema = basicInfoSchemaForStore.merge(detailsSchemaForStore);
export type ProcurementFullFormValues = z.infer<typeof procurementFullFormSchema>;

// EXPORT TabType
export type TabType = 'basic' | 'details' | 'review';

interface ProcurementFormState {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  goToNextTab: () => void;
  goToPreviousTab: () => void;
  form: UseFormReturn<ProcurementFullFormValues, any> | null;
  setForm: (form: UseFormReturn<ProcurementFullFormValues, any> | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  initialData: ProcurementWithRelations | null;
  mode: 'add' | 'edit';
  initializeForm: (initialData: ProcurementWithRelations | null | undefined, mode: 'add' | 'edit') => void;
}

export const useProcurementFormStore = create<ProcurementFormState>((set, get) => ({
  activeTab: 'basic',
  setActiveTab: tab => set({ activeTab: tab }),
  goToNextTab: async () => {
    const { activeTab, form } = get();
    if (form) {
      let fieldsToValidate: (keyof ProcurementFullFormValues)[] = [];
      if (activeTab === 'basic') {
        fieldsToValidate = ['farmerId', 'crop', 'procuredForm', 'speciality', 'quantity'];
      } else if (activeTab === 'details') {
        fieldsToValidate = ['date', 'time', 'lotNo', 'procuredBy', 'vehicleNo'];
      }

      if (fieldsToValidate.length > 0) {
        const isValid = await form.trigger(fieldsToValidate);
        if (!isValid) {
          toast.error('Please correct the errors on the current tab before proceeding.');
          return;
        }
      }
    }

    if (activeTab === 'basic') set({ activeTab: 'details' });
    else if (activeTab === 'details') set({ activeTab: 'review' });
  },
  goToPreviousTab: () => {
    const { activeTab } = get();
    if (activeTab === 'review') set({ activeTab: 'details' });
    else if (activeTab === 'details') set({ activeTab: 'basic' });
  },
  form: null,
  setForm: form => set({ form }),
  isSubmitting: false,
  setIsSubmitting: isSubmitting => set({ isSubmitting }),
  initialData: null,
  mode: 'add',
  initializeForm: (initialData, mode) => {
    set({
      initialData: initialData || null,
      mode,
      activeTab: 'basic',
      isSubmitting: false,
    });
  },
}));
