import { create } from 'zustand';
import { useForm } from 'react-hook-form';
import { differenceInYears } from 'date-fns';

type FormType = ReturnType<typeof useForm>;

export interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  timestamp: number;
}

interface FarmerFormState {
  form: FormType | null;
  activeTab: string;
  isSubmitting: boolean;
  tabs: string[];
  setForm: (form: FormType | null) => void;
  setActiveTab: (tab: string) => void;
  addField: () => void;
  removeField: (index: number) => void;
  setIsSubmitting: (value: boolean) => void;
  goToNextTab: () => void;
  goToPreviousTab: () => void;
  resetForm: () => void;
  updateFieldLocation: (index: number, location: LocationData) => void;
  calculateAge: (birthDate: string) => void;
  notifyFormSuccess: () => void;
}

export const useFarmerFormStore = create<FarmerFormState>((set, get) => ({
  form: null,
  activeTab: 'personal',
  isSubmitting: false,
  tabs: ['personal', 'address', 'bank', 'documents', 'fields', 'review'],

  setForm: form => {
    console.log('Form set in store:', form ? 'Form object exists' : 'Form is null');
    set({ form });
  },
  setActiveTab: tab => set({ activeTab: tab }),

  addField: () => {
    const { form } = get();
    if (!form) return;

    const fields = form.getValues('fields') || [];
    form.setValue('fields', [
      ...fields,
      {
        areaHa: 0,
        yieldEstimate: 0,
        location: {
          lat: 0,
          lng: 0,
          accuracy: 0,
          altitude: null,
          altitudeAccuracy: null,
          timestamp: Date.now(),
        },
        landDocumentUrl: '',
      },
    ]);
  },

  removeField: index => {
    const { form } = get();
    if (!form) return;

    const fields = form.getValues('fields') || [];
    form.setValue(
      'fields',
      fields.filter((_: any, i: number) => i !== index)
    );
  },

  setIsSubmitting: value => set({ isSubmitting: value }),

  goToNextTab: () => {
    const { activeTab, tabs } = get();
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      set({ activeTab: tabs[currentIndex + 1] });
    }
  },

  goToPreviousTab: () => {
    const { activeTab, tabs } = get();
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      set({ activeTab: tabs[currentIndex - 1] });
    }
  },

  resetForm: () => {
    const { form } = get();
    if (form) {
      form.reset();
    }
    set({ activeTab: 'personal', isSubmitting: false });
  },

  updateFieldLocation: (index, location) => {
    const { form } = get();
    if (!form) return;

    form.setValue(`fields.${index}.location`, location);
  },

  calculateAge: birthDate => {
    const { form } = get();
    if (!form || !birthDate) return;

    const age = differenceInYears(new Date(), new Date(birthDate));
    form.setValue('farmer.age', age);
  },

  notifyFormSuccess: () => {
    if (typeof window !== 'undefined') {
      const dataChangedEvent = new CustomEvent('farmerDataChanged');
      document.dispatchEvent(dataChangedEvent);
      console.log('Form submission success event dispatched');
    }
  },
}));
