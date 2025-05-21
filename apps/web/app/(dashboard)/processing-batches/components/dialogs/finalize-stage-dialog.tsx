'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type FinalizeProcessingStageInput as BackendFinalizeProcessingStageInputType } from '@chaya/shared';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@workspace/ui/components/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import { Calendar } from '@workspace/ui/components/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { finalizeProcessingStageAction, getDryingEntriesForStage } from '../../lib/actions';

const finalizeStageFormSchema = z.object({
  dateOfCompletion: z.date({
    required_error: 'Date of Completion is required',
    invalid_type_error: "That's not a valid date!",
  }),
  quantityAfterProcess: z.coerce
    .number({
      required_error: 'Final quantity is required',
      invalid_type_error: 'Final quantity must be a number',
    })
    .positive('Final quantity must be a positive number'),
});

type FinalizeStageFormValues = z.infer<typeof finalizeStageFormSchema>;

interface FinalizeStageDialogProps {
  processingStageId: number;
  batchCode: string;
  processingCount: number;
  currentInitialQuantity: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function FinalizeStageDialog({
  processingStageId,
  batchCode,
  processingCount,
  currentInitialQuantity,
  open,
  onOpenChange,
  onSuccess,
}: FinalizeStageDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDrying, setIsLoadingDrying] = useState(false);

  const form = useForm<FinalizeStageFormValues>({
    resolver: zodResolver(finalizeStageFormSchema),
    defaultValues: {
      dateOfCompletion: new Date(),
      quantityAfterProcess: undefined,
    },
  });

  useEffect(() => {
    if (open && processingStageId) {
      setIsLoadingDrying(true);
      getDryingEntriesForStage(processingStageId)
        .then(dryingEntries => {
          const latestDryingEntry = dryingEntries?.sort((a, b) => b.day - a.day)[0];
          const autoFillQuantity = latestDryingEntry?.currentQuantity ?? currentInitialQuantity;

          form.reset({
            dateOfCompletion: new Date(),
            quantityAfterProcess: parseFloat(autoFillQuantity.toFixed(2)) || undefined,
          });
        })
        .catch(err => {
          toast.error(err.message || 'Could not load latest drying quantity for autofill.');
          console.error('Error fetching drying entries for autofill:', err);
          form.reset({
            dateOfCompletion: new Date(),
            quantityAfterProcess: parseFloat(currentInitialQuantity.toFixed(2)) || undefined,
          });
        })
        .finally(() => {
          setIsLoadingDrying(false);
        });
    }
  }, [open, processingStageId, form, currentInitialQuantity]);

  const onSubmit = async (data: FinalizeStageFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: BackendFinalizeProcessingStageInputType = {
        dateOfCompletion: data.dateOfCompletion,
        quantityAfterProcess: data.quantityAfterProcess,
      };
      await finalizeProcessingStageAction(processingStageId, payload);
      toast.success(`Stage P${processingCount} for Batch ${batchCode} finalized successfully.`);
      document.dispatchEvent(new CustomEvent('processingBatchDataChanged'));
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error finalizing stage:', error);
      toast.error(`Error: ${error.message || 'Failed to finalize stage'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Finalize Stage P{processingCount} for Batch {batchCode}
          </DialogTitle>
          <DialogDescription>
            Enter the completion details. Initial quantity for this stage was {currentInitialQuantity.toFixed(2)}kg.
            {isLoadingDrying && ' Fetching latest drying quantity...'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dateOfCompletion"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Completion</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantityAfterProcess"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity After Process (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter final yield for this stage"
                      {...field}
                      disabled={isLoadingDrying}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || isLoadingDrying}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingDrying}>
                {isSubmitting ? 'Finalizing...' : 'Finalize Stage'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
