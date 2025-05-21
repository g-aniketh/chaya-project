'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createSaleFormSchema,
  type CreateSaleInput as BackendCreateSaleInputType,
  ProcessingStageStatus,
} from '@chaya/shared';
// Removed unused type ProcessingStage, import ProcessingStageStatus instead
// import type { ProcessingStage } from '@chaya/shared';

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
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { format } from 'date-fns'; // Removed unused 'parse'
import { toast } from 'sonner';
import axios from 'axios';
import { z } from 'zod';

type SaleFormDialogValues = z.infer<typeof createSaleFormSchema>;

interface ProcessingStageInfoForSaleDialog {
  id: number;
  processingCount: number;
  quantityAfterProcess: number | null; // Yield of the stage
  status: typeof ProcessingStageStatus | 'SOLD_OUT' | 'NO_STAGES' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED'; // For display
}

interface RecordSaleDialogProps {
  processingBatchId: number;
  processingStage: ProcessingStageInfoForSaleDialog; // Use refined type
  batchCode: string;
  availableForSaleFromStage: number; // This is the key dynamic value: stage_yield - sales_from_stage
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RecordSaleDialog({
  processingBatchId,
  processingStage,
  batchCode,
  availableForSaleFromStage,
  open,
  onOpenChange,
  onSuccess,
}: RecordSaleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SaleFormDialogValues>({
    resolver: zodResolver(createSaleFormSchema),
    defaultValues: {
      quantitySold: undefined, // Keep as undefined
      dateOfSaleInput: new Date(),
      timeOfSaleInput: format(new Date(), 'HH:mm:ss'),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        quantitySold: undefined,
        dateOfSaleInput: new Date(),
        timeOfSaleInput: format(new Date(), 'HH:mm:ss'),
      });
    }
  }, [open, form]);

  const onSubmit = async (data: SaleFormDialogValues) => {
    setIsSubmitting(true);
    // Explicitly coerce quantitySold to number before comparison
    const quantityToSell = Number(data.quantitySold);

    if (quantityToSell > availableForSaleFromStage) {
      toast.error(
        `Cannot sell ${quantityToSell}kg. Only ${availableForSaleFromStage.toFixed(2)}kg available from P${processingStage.processingCount}.`
      );
      setIsSubmitting(false);
      return;
    }

    const datePartStr = format(data.dateOfSaleInput, 'yyyy-MM-dd');
    const timePartStr = data.timeOfSaleInput; // Already HH:mm:ss
    const combinedDateTime = new Date(`${datePartStr}T${timePartStr}`);
    if (isNaN(combinedDateTime.getTime())) {
      toast.error('Invalid date or time for sale.');
      setIsSubmitting(false);
      return;
    }

    const payload: BackendCreateSaleInputType = {
      quantitySold: quantityToSell, // Use coerced number
      dateOfSale: combinedDateTime,
      processingBatchId,
      processingStageId: processingStage.id,
    };
    try {
      await axios.post(`/api/sales`, payload, { withCredentials: true });
      toast.success(
        `Sale of ${payload.quantitySold}kg for Batch ${batchCode} (from P${processingStage.processingCount}) recorded.`
      );
      onSuccess(); // This should trigger a refresh in the table
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error recording sale:', error);
      toast.error(`Error: ${error.response?.data?.error || 'Failed to record sale'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Record Sale from Batch {batchCode} - Stage P{processingStage.processingCount}
          </DialogTitle>
          <DialogDescription>
            Stage Yield: {(processingStage.quantityAfterProcess || 0).toFixed(2)}kg. Available from this stage:{' '}
            {availableForSaleFromStage.toFixed(2)}kg.
            {processingStage.status !== 'FINISHED' &&
              processingStage.status !== 'SOLD_OUT' &&
              " Note: This stage is not marked 'FINISHED' or 'SOLD_OUT'."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="quantitySold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Sold (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder={`Max ${availableForSaleFromStage.toFixed(2)}`}
                      {...field}
                      // value={field.value === undefined ? '' : field.value} // Keep for controlled component
                      onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateOfSaleInput"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Sale</FormLabel>
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
                name="timeOfSaleInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time of Sale</FormLabel>
                    <div className="flex items-center">
                      <FormControl>
                        <Input
                          type="time"
                          step="1" // Allow seconds input
                          className="flex-1"
                          {...field}
                          value={field.value || format(new Date(), 'HH:mm:ss')} // Default to current time if empty
                          onChange={e => {
                            let timeValue = e.target.value;
                            // Basic attempt to ensure HH:mm:ss format on blur or partial input.
                            // More robust validation is via Zod.
                            if (timeValue.match(/^\d{2}:\d{2}$/)) {
                              // If user enters HH:mm
                              timeValue += ':00';
                            } else if (!timeValue.match(/^\d{2}:\d{2}:\d{2}$/)) {
                              // If not HH:mm and not HH:mm:ss, might be invalid.
                              // Revert to field value or current if completely off.
                              timeValue = field.value || format(new Date(), 'HH:mm:ss');
                            }
                            field.onChange(timeValue);
                          }}
                        />
                      </FormControl>
                      <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || availableForSaleFromStage <= 0 || processingStage.status !== 'FINISHED'}
              >
                {isSubmitting ? 'Recording...' : 'Record Sale'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
