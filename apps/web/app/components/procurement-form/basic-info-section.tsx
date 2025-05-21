'use client';

import { useEffect, useState } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form'; // Use useFormContext
import { z } from 'zod';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { Combobox } from '@workspace/ui/components/combobox';
import axios from 'axios';
import { toast } from 'sonner';
import type { ProcurementFullFormValues } from '@/app/stores/procurement-form'; // Import the full form type

interface Farmer {
  id: number;
  name: string;
  village: string;
  mandal: string;
}

const CROP_OPTIONS = ['Turmeric', 'Coffee', 'Ginger', 'Pepper'] as const;
type CropType = (typeof CROP_OPTIONS)[number];

const PROCURED_FORMS_BY_CROP: Record<CropType, string[]> = {
  Turmeric: ['Fresh Finger', 'Fresh Bulb', 'Dried Finger', 'Dried Bulb'],
  Coffee: ['Fruit', 'Dry Cherry', 'Parchment'],
  Ginger: ['Fresh', 'Dried'],
  Pepper: ['Green Pepper', 'Black Pepper'],
};

export function BasicInfoSection() {
  const {
    control,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<ProcurementFullFormValues>(); // Use context

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoadingFarmers, setIsLoadingFarmers] = useState(false);

  const watchedCrop = watch('crop'); // Watch from the shared form context

  useEffect(() => {
    if (watchedCrop) {
      const currentProcuredFormsForNewCrop = PROCURED_FORMS_BY_CROP[watchedCrop as CropType] || [];
      const currentProcuredFormValue = control._formValues.procuredForm; // Access current value directly

      if (currentProcuredFormValue && !currentProcuredFormsForNewCrop.includes(currentProcuredFormValue)) {
        setValue('procuredForm', '', { shouldValidate: true });
      } else if (!currentProcuredFormValue && currentProcuredFormsForNewCrop.length > 0) {
        // If crop changes and procuredForm was empty, keep it empty unless logic dictates a default.
      }
    }
  }, [watchedCrop, setValue, control._formValues.procuredForm]);

  useEffect(() => {
    const fetchFarmers = async () => {
      setIsLoadingFarmers(true);
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
        const response = await axios.get(`${BACKEND_URL}/api/farmers`, {
          params: { limit: 1000, isActive: true },
          withCredentials: true,
        });
        setFarmers(response.data.farmers);
      } catch (error) {
        console.error('Error fetching farmers:', error);
        toast.error('Failed to load farmers. Please try again.');
      } finally {
        setIsLoadingFarmers(false);
      }
    };
    fetchFarmers();
  }, []);

  const currentProcuredForms = watchedCrop ? PROCURED_FORMS_BY_CROP[watchedCrop as CropType] || [] : [];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="farmerId">Farmer</Label>
            <Controller
              control={control}
              name="farmerId"
              render={({ field }) => (
                <Combobox
                  items={farmers.map(farmer => ({
                    label: `${farmer.name} (${farmer.village}, ${farmer.mandal})`,
                    value: farmer.id.toString(),
                  }))}
                  value={field.value ? field.value.toString() : ''}
                  onChange={val => field.onChange(val ? parseInt(val, 10) : undefined)}
                  placeholder="Select a farmer"
                  isLoading={isLoadingFarmers}
                />
              )}
            />
            {errors.farmerId && <p className="text-sm text-red-500 mt-1">{errors.farmerId.message}</p>}
          </div>
          <div>
            <Label htmlFor="crop">Crop</Label>
            <Controller
              control={control}
              name="crop"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''} // Ensure value is passed for controlled Select
                  // defaultValue={field.value} // Not needed if value is passed
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select crop" />
                  </SelectTrigger>
                  <SelectContent>
                    {CROP_OPTIONS.map(cropName => (
                      <SelectItem key={cropName} value={cropName}>
                        {cropName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.crop && <p className="text-sm text-red-500 mt-1">{errors.crop.message}</p>}
          </div>
          <div>
            <Label htmlFor="procuredForm">Procured Form</Label>
            <Controller
              control={control}
              name="procuredForm"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''} // Ensure value is passed
                  disabled={!watchedCrop || currentProcuredForms.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select form (after choosing crop)" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentProcuredForms.map(formName => (
                      <SelectItem key={formName} value={formName}>
                        {formName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.procuredForm && <p className="text-sm text-red-500 mt-1">{errors.procuredForm.message}</p>}
          </div>
          <div>
            <Label htmlFor="speciality">Speciality</Label>
            <Controller
              control={control}
              name="speciality"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select speciality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Organic">Organic</SelectItem>
                    <SelectItem value="Non-GMO">Non-GMO</SelectItem>
                    <SelectItem value="Fair Trade">Fair Trade</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.speciality && <p className="text-sm text-red-500 mt-1">{errors.speciality.message}</p>}
          </div>
          <div>
            <Label htmlFor="quantity">Quantity (kg)</Label>
            <Controller
              control={control}
              name="quantity"
              render={({ field }) => (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...field}
                  value={field.value === undefined ? '' : field.value}
                  onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                />
              )}
            />
            {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
