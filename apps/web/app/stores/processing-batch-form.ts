import { create } from 'zustand';
import type { UseFormReturn } from 'react-hook-form';
import type { Procurement as BaseProcurement, CreateProcessingBatchInput } from '@chaya/shared'; // Renamed to BaseProcurement
import { toast } from 'sonner';

// Define the procurement type as it's stored in this Zustand store
export interface ProcurementWithFarmerForStore extends BaseProcurement {
  farmer: { name: string; village?: string }; // village is optional if not always present/needed
}

type ProcessingBatchFormStep = 'selectCriteria' | 'selectProcurements' | 'firstStageDetails' | 'review';

interface ProcessingBatchFormState {
  activeStep: ProcessingBatchFormStep;
  setActiveStep: (step: ProcessingBatchFormStep) => void;
  goToNextStep: () => void;
  goToPreviousTab: () => void;

  initialCrop: string | null;
  initialLotNo: number | null;

  lockedCrop: string | null;
  lockedLotNo: number | null;
  lockedProcuredForm: string | null;
  filterCriteriaLocked: boolean;

  availableProcurements: ProcurementWithFarmerForStore[]; // USE THE NEW TYPE HERE
  selectedProcurementIds: number[];
  firstStageDetails: Partial<CreateProcessingBatchInput['firstStageDetails']>;

  setInitialCriteria: (criteria: { crop?: string | null; lotNo?: number | null }) => void;
  setAvailableProcurements: (procurements: ProcurementWithFarmerForStore[]) => void; // EXPECT THE NEW TYPE
  toggleSelectedProcurement: (procurement: ProcurementWithFarmerForStore) => void; // EXPECT THE NEW TYPE
  setFirstStageDetails: (details: Partial<CreateProcessingBatchInput['firstStageDetails']>) => void;

  clearLockedFilters: () => void;

  form: UseFormReturn<any> | null;
  setForm: (form: UseFormReturn<any> | null) => void;

  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;

  resetForm: () => void;
}

const initialFirstStageDetailsState: Partial<CreateProcessingBatchInput['firstStageDetails']> = {
  processMethod: 'wet',
  dateOfProcessing: new Date(),
  doneBy: '',
};

const initialCoreState = {
  activeStep: 'selectCriteria' as ProcessingBatchFormStep,
  initialCrop: null,
  initialLotNo: null,
  lockedCrop: null,
  lockedLotNo: null,
  lockedProcuredForm: null,
  filterCriteriaLocked: false,
  availableProcurements: [],
  selectedProcurementIds: [],
  firstStageDetails: { ...initialFirstStageDetailsState },
  form: null,
  isSubmitting: false,
};

export const useProcessingBatchFormStore = create<ProcessingBatchFormState>((set, get) => ({
  ...initialCoreState,
  setActiveStep: step => set({ activeStep: step }),
  goToNextStep: () => {
    const { activeStep } = get();
    if (activeStep === 'selectCriteria') set({ activeStep: 'selectProcurements' });
    else if (activeStep === 'selectProcurements') set({ activeStep: 'firstStageDetails' });
    else if (activeStep === 'firstStageDetails') set({ activeStep: 'review' });
  },
  goToPreviousTab: () => {
    const { activeStep } = get();
    if (activeStep === 'review') set({ activeStep: 'firstStageDetails' });
    else if (activeStep === 'firstStageDetails') {
      set({ activeStep: 'selectProcurements' });
    } else if (activeStep === 'selectProcurements') {
      set({
        activeStep: 'selectCriteria',
        filterCriteriaLocked: false,
        lockedCrop: null,
        lockedLotNo: null,
        lockedProcuredForm: null,
        selectedProcurementIds: [],
      });
    }
  },

  setInitialCriteria: criteria =>
    set({
      initialCrop: criteria.crop || null,
      initialLotNo: criteria.lotNo || null,
      lockedCrop: criteria.crop || null,
      lockedLotNo: criteria.lotNo || null,
      lockedProcuredForm: null,
      filterCriteriaLocked: !!(criteria.crop && criteria.lotNo),
      selectedProcurementIds: [],
      availableProcurements: [],
    }),

  setAvailableProcurements: procurements => set({ availableProcurements: procurements }),

  toggleSelectedProcurement: procurement => {
    // procurement is ProcurementWithFarmerForStore
    set(state => {
      const isSelected = state.selectedProcurementIds.includes(procurement.id);
      let newSelectedIds = [...state.selectedProcurementIds];
      let newLockedCrop = state.lockedCrop;
      let newLockedLotNo = state.lockedLotNo;
      let newLockedProcuredForm = state.lockedProcuredForm;
      let newFilterCriteriaLocked = state.filterCriteriaLocked;

      if (isSelected) {
        newSelectedIds = newSelectedIds.filter(pid => pid !== procurement.id);
        if (newSelectedIds.length === 0) {
          newFilterCriteriaLocked = !!(state.initialCrop && state.initialLotNo);
          newLockedCrop = state.initialCrop;
          newLockedLotNo = state.initialLotNo;
          newLockedProcuredForm = null;
        }
      } else {
        // procurement.procuredForm is available because type is ProcurementWithFarmerForStore
        if (!state.filterCriteriaLocked || state.selectedProcurementIds.length === 0) {
          newLockedCrop = state.initialCrop || procurement.crop;
          newLockedLotNo = state.initialLotNo || procurement.lotNo;
          newLockedProcuredForm = procurement.procuredForm;
          newFilterCriteriaLocked = true;
          newSelectedIds.push(procurement.id);
        } else {
          if (
            procurement.crop === newLockedCrop &&
            procurement.lotNo === newLockedLotNo &&
            procurement.procuredForm === newLockedProcuredForm
          ) {
            newSelectedIds.push(procurement.id);
          } else {
            toast.error(
              'This procurement does not match the established batch criteria (Crop, Lot No, Procured Form).'
            );
          }
        }
      }
      return {
        selectedProcurementIds: newSelectedIds,
        lockedCrop: newLockedCrop,
        lockedLotNo: newLockedLotNo,
        lockedProcuredForm: newLockedProcuredForm,
        filterCriteriaLocked: newFilterCriteriaLocked,
      };
    });
  },

  setFirstStageDetails: details =>
    set(state => ({
      firstStageDetails: { ...state.firstStageDetails, ...details },
    })),

  clearLockedFilters: () =>
    set({
      lockedCrop: null,
      lockedLotNo: null,
      lockedProcuredForm: null,
      filterCriteriaLocked: false,
    }),

  setForm: form => set({ form }),
  setIsSubmitting: isSubmitting => set({ isSubmitting }),
  resetForm: () => set({ ...initialCoreState, firstStageDetails: { ...initialFirstStageDetailsState } }),
}));
