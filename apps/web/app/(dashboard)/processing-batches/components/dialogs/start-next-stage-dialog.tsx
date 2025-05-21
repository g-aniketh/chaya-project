'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type CreateProcessingStageInput as BackendCreateProcessingStageInputType } from '@chaya/shared';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import { Calendar } from '@workspace/ui/components/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import axios from 'axios';

const nextStageFormStepSchema = z.object({
  processMethod: z.enum(['wet', 'dry'], { required_error: 'Process method is required' }),
  dateOfProcessing: z.date({
    required_error: 'Date of Processing is required',
    invalid_type_error: "That's not a valid date!",
  }),
  doneBy: z.string().min(1, 'Person responsible is required'),
});

type NextStageFormValues = z.infer<typeof nextStageFormStepSchema>;

interface StartNextStageDialogProps {
  processingBatchId: number;
  batchCode: string;
  previousStageId: number;
  previousProcessingCount: number;
  previousStageYield: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function StartNextStageDialog({
  processingBatchId,
  batchCode,
  previousStageId,
  previousProcessingCount,
  previousStageYield,
  open,
  onOpenChange,
  onSuccess,
}: StartNextStageDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextProcessingCount = previousProcessingCount + 1;

  const form = useForm<NextStageFormValues>({
    resolver: zodResolver(nextStageFormStepSchema),
    defaultValues: {
      processMethod: 'wet',
      dateOfProcessing: new Date(),
      doneBy: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        processMethod: 'wet',
        dateOfProcessing: new Date(),
        doneBy: '',
      });
    }
  }, [open, form]);

  const onSubmit = async (data: NextStageFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: BackendCreateProcessingStageInputType = {
        processMethod: data.processMethod,
        dateOfProcessing: data.dateOfProcessing,
        doneBy: data.doneBy,
        processingBatchId,
        previousStageId,
      };
      await axios.post(`/api/processing-stages`, payload, { withCredentials: true });
      toast.success(`Stage P${nextProcessingCount} for Batch ${batchCode} started successfully.`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error starting next stage:', error);
      toast.error(`Error: ${error.response?.data?.error || 'Failed to start next stage'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Start Next Stage (P{nextProcessingCount}) for Batch {batchCode}
          </DialogTitle>
          <DialogDescription>
            Stage P{previousProcessingCount} finished with a yield of {previousStageYield.toFixed(2)}kg. The new stage P
            {nextProcessingCount} will start with the quantity remaining after any sales from P{previousProcessingCount}
            .
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="processMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Process Method (P{nextProcessingCount})</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="wet">Wet</SelectItem>
                      <SelectItem value="dry">Dry</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfProcessing"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Processing (P{nextProcessingCount})</FormLabel>
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
              name="doneBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Done By (P{nextProcessingCount})</FormLabel>
                  <FormControl>
                    <Input placeholder="Responsible person/team" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Starting Stage...' : `Start P${nextProcessingCount}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
