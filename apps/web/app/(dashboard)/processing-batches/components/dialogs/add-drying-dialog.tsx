'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDryingEntrySchema, type CreateDryingEntryInput, type Drying } from '@chaya/shared';
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
import { toast } from 'sonner';
import axios from 'axios';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { getDryingEntriesForStage } from '../../lib/actions';

interface AddDryingDialogProps {
  processingStageId: number;
  batchCode: string;
  processingCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddDryingDialog({
  processingStageId,
  batchCode,
  processingCount,
  open,
  onOpenChange,
  onSuccess,
}: AddDryingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingDryingEntries, setExistingDryingEntries] = useState<Drying[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  const form = useForm<CreateDryingEntryInput>({
    resolver: zodResolver(createDryingEntrySchema),
    defaultValues: {
      processingStageId: processingStageId,
      day: 1,
      temperature: 25,
      humidity: 60,
      pH: 7,
      moisturePercentage: 15,
      currentQuantity: 0,
    },
  });

  useEffect(() => {
    if (open && processingStageId) {
      form.setValue('processingStageId', processingStageId);
      const fetchExistingEntries = async () => {
        setIsLoadingEntries(true);
        try {
          const entries = await getDryingEntriesForStage(processingStageId);
          setExistingDryingEntries(entries);
          const nextDay = entries.length > 0 ? Math.max(...entries.map(d => d.day)) + 1 : 1;
          form.setValue('day', nextDay);
          const lastEntry = entries.sort((a: { day: number }, b: { day: number }) => b.day - a.day)[0];
          form.setValue('currentQuantity', lastEntry ? lastEntry.currentQuantity : 0);
        } catch (error: any) {
          toast.error(error.message || 'Failed to load existing drying entries.');
        } finally {
          setIsLoadingEntries(false);
        }
      };
      fetchExistingEntries();
    }
  }, [open, processingStageId, form]);

  const onSubmit = async (data: CreateDryingEntryInput) => {
    setIsSubmitting(true);
    try {
      await axios.post(`/api/processing-stages/${processingStageId}/drying`, data, { withCredentials: true });
      toast.success(`Drying data for Day ${data.day} added successfully.`);
      onSuccess();
      onOpenChange(false);
      const nextDay = data.day + 1;
      form.reset({
        ...form.formState.defaultValues,
        day: nextDay,
        processingStageId,
        currentQuantity: data.currentQuantity,
      });
    } catch (error: any) {
      console.error('Error adding drying data:', error);
      toast.error(`Error: ${error.response?.data?.error || 'Failed to add drying data'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Add Drying Data for Batch {batchCode} - P{processingCount}
          </DialogTitle>
          <DialogDescription>Enter the drying parameters for the specified day.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day Number</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature (°C)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="humidity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Humidity (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pH"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>pH Level</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="moisturePercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moisture (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Quantity (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingEntries}>
                {isSubmitting ? 'Adding...' : 'Add Entry'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        {isLoadingEntries && <p className="text-sm text-center py-4">Loading existing entries...</p>}
        {!isLoadingEntries && existingDryingEntries.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-semibold mb-2">Previous Drying Entries (P{processingCount})</h4>
            <ScrollArea className="h-[200px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Temp</TableHead>
                    <TableHead>Hum</TableHead>
                    <TableHead>pH</TableHead>
                    <TableHead>Moist%</TableHead>
                    <TableHead>Qty(kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingDryingEntries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.day}</TableCell>
                      <TableCell>{entry.temperature}°C</TableCell>
                      <TableCell>{entry.humidity}%</TableCell>
                      <TableCell>{entry.pH}</TableCell>
                      <TableCell>{entry.moisturePercentage}%</TableCell>
                      <TableCell>{entry.currentQuantity}kg</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
