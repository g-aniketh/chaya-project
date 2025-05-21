'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { format } from 'date-fns';
import { Calendar } from '@workspace/ui/components/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import type { ProcurementFullFormValues } from '@/app/stores/procurement-form';

export function DetailsSection() {
  const {
    control,
    register: formRegister,
    formState: { errors },
  } = useFormContext<ProcurementFullFormValues>();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value instanceof Date ? field.value : undefined}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <Label htmlFor="time">Time</Label>
            <Controller
              control={control}
              name="time"
              render={({ field }) => (
                <div className="flex items-center">
                  <Input
                    type="time"
                    step="1"
                    className="flex-1"
                    {...field}
                    value={field.value ? field.value.substring(0, 8) : format(new Date(), 'HH:mm:ss')}
                    onChange={e => {
                      let timeValue = e.target.value;
                      if (timeValue.match(/^\d{2}:\d{2}$/)) {
                        timeValue += ':00';
                      } else if (!timeValue.match(/^\d{2}:\d{2}:\d{2}$/)) {
                        timeValue = field.value || format(new Date(), 'HH:mm:ss');
                      }
                      field.onChange(timeValue);
                    }}
                  />
                  <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                </div>
              )}
            />
            {errors.time && <p className="text-sm text-red-500 mt-1">{errors.time.message}</p>}
          </div>

          <div>
            <Label htmlFor="lotNo">Lot Number</Label>
            <Controller
              control={control}
              name="lotNo"
              render={({ field }) => (
                <Select onValueChange={value => field.onChange(Number.parseInt(value))} value={field.value?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lot number" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.lotNo && <p className="text-sm text-red-500 mt-1">{errors.lotNo.message}</p>}
          </div>

          <div>
            <Label htmlFor="procuredBy">Procured By</Label>
            <Input id="procuredBy" {...formRegister('procuredBy')} />
            {errors.procuredBy && <p className="text-sm text-red-500 mt-1">{errors.procuredBy.message}</p>}
          </div>

          <div>
            <Label htmlFor="vehicleNo">Vehicle Number</Label>
            <Input id="vehicleNo" {...formRegister('vehicleNo')} />
            {errors.vehicleNo && <p className="text-sm text-red-500 mt-1">{errors.vehicleNo.message}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
