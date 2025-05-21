'use client';

import { useProcessingBatchFormStore } from '@/app/stores/processing-batch-form';
import { Button } from '@workspace/ui/components/button';
import { Progress } from '@workspace/ui/components/progress';
import { useEffect } from 'react';

import { SelectCriteriaStep } from './components/select-criteria-step';
import { SelectProcurementsStep } from './components/select-procurements-step';
import { FirstStageDetailsStep } from './components/first-stage-details-step';
import { ReviewAndSubmitStep } from './components/review-submit-step';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import type { FieldError, FieldErrorsImpl, Merge } from 'react-hook-form'; // Import types for error messages

export default function AddProcessingBatchPage() {
  const router = useRouter();
  const {
    activeStep,
    goToNextStep,
    goToPreviousTab,
    setInitialCriteria,
    initialCrop, // Use initial for criteria step
    initialLotNo, // Use initial for criteria step
    selectedProcurementIds,
    firstStageDetails,
    isSubmitting,
    setIsSubmitting,
    resetForm,
    form: currentStepForm,
    lockedCrop, // Use locked values for submission and later steps
    lockedLotNo,
    lockedProcuredForm,
  } = useProcessingBatchFormStore();

  useEffect(() => {
    return () => {
      // resetForm(); // Consider if this is desired on unmount
    };
  }, [resetForm]);

  const steps = [
    { id: 'selectCriteria', title: 'Select Criteria', progress: 25 },
    { id: 'selectProcurements', title: 'Select Procurements', progress: 50 },
    { id: 'firstStageDetails', title: 'First Stage Details (P1)', progress: 75 },
    { id: 'review', title: 'Review & Submit', progress: 100 },
  ];

  const currentStepConfig = steps.find(s => s.id === activeStep);

  const getFirstErrorMessage = (errors: Partial<Readonly<FieldErrorsImpl<any>>>): string | undefined => {
    if (errors.crop && typeof errors.crop.message === 'string') return errors.crop.message;
    if (errors.lotNo && typeof errors.lotNo.message === 'string') return errors.lotNo.message;
    // Check for schema level refine error (which might not have a specific field path if path is ["_error"] or just one path is given in refine)
    const refineErrorKey = Object.keys(errors).find(
      key => errors[key] && typeof errors[key]?.message === 'string' && !errors[key]?.ref
    );
    if (refineErrorKey && errors[refineErrorKey] && typeof errors[refineErrorKey]?.message === 'string') {
      return errors[refineErrorKey]?.message as string;
    }
    return undefined;
  };

  const handleNext = async () => {
    if (activeStep === 'selectCriteria') {
      if (currentStepForm) {
        const isValid = await currentStepForm.trigger();
        if (!isValid) {
          const firstError = getFirstErrorMessage(currentStepForm.formState.errors);
          toast.error(firstError || 'Please provide valid criteria (at least Crop or Lot No).'); // Updated message
          return;
        }
        const criteriaValues = currentStepForm.getValues();
        // criteriaValues.crop and criteriaValues.lotNo can be null/undefined here
        setInitialCriteria({
          crop: criteriaValues.crop || null,
          lotNo: typeof criteriaValues.lotNo === 'number' ? criteriaValues.lotNo : null,
        });
      } else {
        // This case should ideally not be hit if setForm works correctly
        setInitialCriteria({ crop: null, lotNo: null });
      }
    }
    if (activeStep === 'selectProcurements' && selectedProcurementIds.length === 0) {
      toast.error('Please select at least one procurement to form the batch.');
      return;
    }

    if (activeStep === 'firstStageDetails' && currentStepForm) {
      const isValid = await currentStepForm.trigger();
      if (!isValid) {
        toast.error(
          getFirstErrorMessage(currentStepForm.formState.errors) || 'Please fill in all required P1 details.'
        );
        return;
      }
      useProcessingBatchFormStore.getState().setFirstStageDetails(currentStepForm.getValues());
    }
    goToNextStep();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const p1Date = firstStageDetails.dateOfProcessing;
      let p1DateString: string | undefined = undefined;

      if (p1Date instanceof Date) {
        p1DateString = p1Date.toISOString();
      } else if (typeof p1Date === 'string') {
        try {
          p1DateString = new Date(p1Date).toISOString();
        } catch (e) {
          /* will be caught below */
        }
      }

      if (!p1DateString) {
        toast.error('P1 Date of Processing is missing or invalid.');
        setIsSubmitting(false);
        return;
      }
      if (!firstStageDetails.processMethod) {
        toast.error('P1 Process Method is missing.');
        setIsSubmitting(false);
        return;
      }
      if (!firstStageDetails.doneBy) {
        toast.error('P1 Done By is missing.');
        setIsSubmitting(false);
        return;
      }
      if (!lockedCrop || typeof lockedLotNo !== 'number' || !lockedProcuredForm) {
        toast.error(
          'Batch criteria (Crop, Lot No, Procured Form) are not fully determined. Please select procurements.'
        );
        setIsSubmitting(false);
        return;
      }

      const payload = {
        crop: lockedCrop,
        lotNo: lockedLotNo, // Already ensured it's a number in previous step's logic if it came from form
        procurementIds: selectedProcurementIds,
        firstStageDetails: {
          processMethod: firstStageDetails.processMethod,
          dateOfProcessing: p1DateString,
          doneBy: firstStageDetails.doneBy,
        },
      };

      const response = await axios.post('/api/processing-batches', payload, { withCredentials: true });

      if (response.status === 201) {
        toast.success('Processing Batch created successfully!');
        const dataChangedEvent = new CustomEvent('processingBatchDataChanged');
        document.dispatchEvent(dataChangedEvent);
        resetForm();
        router.push('/processing-batches');
      } else {
        throw new Error(response.data.error || 'Failed to create processing batch');
      }
    } catch (error: any) {
      console.error('Error creating processing batch:', error);
      const errorMsg =
        error.response?.data?.details?.[0]?.message ||
        error.response?.data?.error ||
        error.message ||
        'Something went wrong';
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    goToPreviousTab();
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Add New Processing Batch</h1>
      <Progress value={currentStepConfig?.progress || 0} className="w-full" />
      <p className="text-sm text-muted-foreground">Step: {currentStepConfig?.title}</p>
      <div className="mt-6">
        {activeStep === 'selectCriteria' && <SelectCriteriaStep />}
        {activeStep === 'selectProcurements' && <SelectProcurementsStep />}
        {activeStep === 'firstStageDetails' && <FirstStageDetailsStep />}
        {activeStep === 'review' && <ReviewAndSubmitStep />}
      </div>
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={handlePrevious} disabled={activeStep === 'selectCriteria' || isSubmitting}>
          Previous
        </Button>
        {activeStep !== 'review' ? (
          <Button onClick={handleNext} disabled={isSubmitting}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Create Batch & Start P1'}
          </Button>
        )}
      </div>
    </div>
  );
}
