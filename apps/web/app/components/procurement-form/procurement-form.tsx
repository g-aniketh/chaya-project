'use client';

import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Button } from '@workspace/ui/components/button';
import { BasicInfoSection } from './basic-info-section';
import { DetailsSection } from './details-section';
import { ReviewSection } from './review-section';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@workspace/ui/components/dialog';
import {
  useProcurementFormStore,
  procurementFullFormSchema,
  type ProcurementFullFormValues,
  type TabType,
} from '@/app/stores/procurement-form';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { updateProcurementAction } from '@/app/(dashboard)/procurements/lib/actions';

interface ProcurementFormProps {
  mode: 'add' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procurementId?: number;
}

export function ProcurementForm({ mode, open, onOpenChange, procurementId }: ProcurementFormProps) {
  const {
    activeTab,
    setActiveTab,
    goToNextTab,
    goToPreviousTab,
    setForm: setZustandForm,
    isSubmitting,
    setIsSubmitting,
    initialData,
  } = useProcurementFormStore();

  const title = mode === 'add' ? 'Add New Procurement' : 'Edit Procurement';

  const formDefaultValues =
    mode === 'edit' && initialData
      ? {
          farmerId: initialData.farmerId,
          crop: initialData.crop || '',
          procuredForm: initialData.procuredForm || '',
          speciality: initialData.speciality || '',
          quantity: initialData.quantity,
          date: initialData.date ? new Date(initialData.date) : new Date(),
          time: initialData.time ? format(new Date(initialData.time), 'HH:mm:ss') : format(new Date(), 'HH:mm:ss'),
          lotNo: initialData.lotNo,
          procuredBy: initialData.procuredBy,
          vehicleNo: initialData.vehicleNo || '',
        }
      : {
          farmerId: undefined,
          crop: '',
          procuredForm: '',
          speciality: '',
          quantity: undefined,
          date: new Date(),
          time: format(new Date(), 'HH:mm:ss'),
          lotNo: 1,
          procuredBy: '',
          vehicleNo: '',
        };

  const methods = useForm<ProcurementFullFormValues>({
    resolver: zodResolver(procurementFullFormSchema),
    defaultValues: formDefaultValues,
  });

  useEffect(() => {
    setZustandForm(methods);
  }, [methods, setZustandForm]);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        methods.reset({
          farmerId: initialData.farmerId,
          crop: initialData.crop || '',
          procuredForm: initialData.procuredForm || '',
          speciality: initialData.speciality || '',
          quantity: initialData.quantity,
          date: new Date(initialData.date),
          time: format(new Date(initialData.time), 'HH:mm:ss'),
          lotNo: initialData.lotNo,
          procuredBy: initialData.procuredBy,
          vehicleNo: initialData.vehicleNo || '',
        });
      } else if (mode === 'add') {
        methods.reset({
          farmerId: undefined,
          crop: '',
          procuredForm: '',
          speciality: '',
          quantity: undefined,
          date: new Date(),
          time: format(new Date(), 'HH:mm:ss'),
          lotNo: 1,
          procuredBy: '',
          vehicleNo: '',
        });
      }
    }
  }, [open, mode, initialData, methods]);

  const processAndSubmitData = async (data: ProcurementFullFormValues) => {
    setIsSubmitting(true);

    const payload = {
      ...data,
      date: data.date instanceof Date ? data.date : new Date(data.date),
    };

    console.log('Submitting data to backend:', JSON.stringify(payload, null, 2));

    try {
      if (mode === 'add') {
        await fetch(`/api/procurements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }).then(async res => {
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to add procurement');
          }
          return res.json();
        });
        toast.success('Procurement added successfully');
      } else if (procurementId) {
        await updateProcurementAction(procurementId, payload);
        toast.success('Procurement updated successfully');
      }

      document.dispatchEvent(new CustomEvent('procurementDataChanged'));
      onOpenChange(false);
      useProcurementFormStore.getState().initializeForm(null, 'add');
    } catch (error: any) {
      console.error('Error submitting form:', error);
      const errorDetails = error.response?.data?.details;
      let errorMessage = error.message || 'Something went wrong';
      if (error.response?.data?.error) errorMessage = error.response.data.error;

      if (errorDetails && Array.isArray(errorDetails)) {
        errorMessage = errorDetails.map((detail: any) => `${detail.path.join('.')}: ${detail.message}`).join('; ');
      }
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        onOpenChange(isOpen);
        if (!isOpen) {
          useProcurementFormStore.getState().initializeForm(null, 'add');
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(processAndSubmitData)}>
            <Tabs value={activeTab} onValueChange={value => setActiveTab(value as TabType)} className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4">
                <BasicInfoSection />
              </TabsContent>
              <TabsContent value="details" className="space-y-4">
                <DetailsSection />
              </TabsContent>
              <TabsContent value="review" className="space-y-4">
                <ReviewSection />
              </TabsContent>
            </Tabs>
            <DialogFooter className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={goToPreviousTab} disabled={activeTab === 'basic'}>
                  Previous
                </Button>
                <Button type="button" variant="outline" onClick={goToNextTab} disabled={activeTab === 'review'}>
                  Next
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                {activeTab === 'review' && (
                  <Button type="submit" disabled={isSubmitting || (!methods.formState.isDirty && mode === 'edit')}>
                    {isSubmitting ? 'Saving...' : 'Save Procurement'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
