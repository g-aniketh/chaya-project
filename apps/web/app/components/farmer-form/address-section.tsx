'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@workspace/ui/components/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';

export function AddressSection() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="farmer.state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State</FormLabel>
              <FormControl>
                <Input placeholder="Enter state" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="farmer.district"
          render={({ field }) => (
            <FormItem>
              <FormLabel>District</FormLabel>
              <FormControl>
                <Input placeholder="Enter district" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="farmer.mandal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mandal</FormLabel>
              <FormControl>
                <Input placeholder="Enter mandal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="farmer.village"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Village</FormLabel>
              <FormControl>
                <Input placeholder="Enter village" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="farmer.panchayath"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Panchayath</FormLabel>
              <FormControl>
                <Input placeholder="Enter panchayath" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
