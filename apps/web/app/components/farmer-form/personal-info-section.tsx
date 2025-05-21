'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@workspace/ui/components/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { addYears, format, subYears } from 'date-fns';
import { Calendar } from '@workspace/ui/components/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import { Button } from '@workspace/ui/components/button';
import { useEffect, useState } from 'react';
import { useFarmerFormStore } from '@/app/stores/farmer-form';
import { cn } from '@workspace/ui/lib/utils';

export function PersonalInfoSection() {
  const { control, watch } = useFormContext();
  const { calculateAge } = useFarmerFormStore();

  // Watch birth date to calculate age automatically
  const birthDate = watch('farmer.dateOfBirth');

  // State for the calendar to handle year navigation
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  useEffect(() => {
    if (birthDate) {
      calculateAge(birthDate);
    }
  }, [birthDate, calculateAge]);

  // Navigate years quickly
  const goToPreviousYear = () => {
    setCalendarDate(prev => subYears(prev, 1));
  };

  const goToNextYear = () => {
    setCalendarDate(prev => addYears(prev, 1));
  };

  const goBackTenYears = () => {
    setCalendarDate(prev => subYears(prev, 10));
  };

  const goForwardTenYears = () => {
    setCalendarDate(prev => addYears(prev, 10));
  };

  // Array of common years for quick selection
  const quickYears = [
    new Date().getFullYear() - 18, // 18 years ago
    new Date().getFullYear() - 25, // 25 years ago
    new Date().getFullYear() - 35, // 35 years ago
    new Date().getFullYear() - 45, // 45 years ago
    new Date().getFullYear() - 55, // 55 years ago
    new Date().getFullYear() - 65, // 65 years ago
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="farmer.name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="farmer.relationship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SELF">SELF</SelectItem>
                  <SelectItem value="SPOUSE">SPOUSE</SelectItem>
                  <SelectItem value="CHILD">CHILD</SelectItem>
                  <SelectItem value="OTHER">OTHER</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="farmer.gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MALE">MALE</SelectItem>
                  <SelectItem value="FEMALE">FEMALE</SelectItem>
                  <SelectItem value="OTHER">OTHER</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="farmer.community"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Community</FormLabel>
              <FormControl>
                <Input placeholder="Enter community" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="farmer.aadharNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aadhar Number</FormLabel>
              <FormControl>
                <Input placeholder="12-digit Aadhar number" {...field} maxLength={12} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="farmer.dateOfBirth"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of Birth</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                    >
                      {field.value ? format(new Date(field.value), 'PPP') : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-2 border-b flex items-center justify-between">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={goBackTenYears} title="Back 10 years">
                        <ChevronLeft className="h-4 w-4" />
                        <ChevronLeft className="h-4 w-4 -ml-2" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={goToPreviousYear} title="Previous year">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm font-medium">{format(calendarDate, 'yyyy')}</div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={goToNextYear} title="Next year">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={goForwardTenYears} title="Forward 10 years">
                        <ChevronRight className="h-4 w-4" />
                        <ChevronRight className="h-4 w-4 -ml-2" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-2 border-b">
                    <div className="text-sm font-medium mb-2">Quick Select Year</div>
                    <div className="grid grid-cols-3 gap-1">
                      {quickYears.map(year => (
                        <Button
                          key={year}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newDate = new Date(calendarDate);
                            newDate.setFullYear(year);
                            setCalendarDate(newDate);
                          }}
                        >
                          {year}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={date => field.onChange(date?.toISOString().split('T')[0] || '')}
                    disabled={date => date > new Date() || date < new Date('1900-01-01')}
                    month={calendarDate}
                    onMonthChange={setCalendarDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="farmer.age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Auto-calculated from birth date"
                  {...field}
                  value={field.value || ''}
                  disabled
                  className="bg-muted"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="farmer.contactNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Number</FormLabel>
              <FormControl>
                <Input placeholder="10-digit contact number" {...field} maxLength={10} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
