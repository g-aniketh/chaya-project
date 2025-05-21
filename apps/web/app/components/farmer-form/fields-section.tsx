'use client';

import { useFormContext } from 'react-hook-form';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { DocumentUploader } from '../upload/document-uploader';
import { Plus, Trash2 } from 'lucide-react';
import { useFarmerFormStore } from '@/app/stores/farmer-form';
import { LocationButton, LocationData } from './LocationButton';

export function FieldsSection() {
  const { control, watch, setValue } = useFormContext();
  const fields = watch('fields') || [];
  const { addField, removeField } = useFarmerFormStore();

  const handleLocationUpdate = (index: number, locationData: LocationData) => {
    setValue(`fields.${index}.location`, locationData, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Farm Fields</h3>
        <Button type="button" onClick={() => addField()} size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Field
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((_: any, index: number) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Field {index + 1}</CardTitle>
              {fields.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeField(index)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={control}
                  name={`fields.${index}.areaHa`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area (Hectares)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter area"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`fields.${index}.yieldEstimate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yield Estimate</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter yield estimate"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="sm:col-span-2 space-y-4">
                  <FormLabel>Location</FormLabel>
                  <LocationButton
                    onLocationUpdate={(locationData: any) => handleLocationUpdate(index, locationData)}
                    fieldIndex={index}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                    <FormField
                      control={control}
                      name={`fields.${index}.location.lat`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter latitude"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`fields.${index}.location.lng`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter longitude"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={control}
                  name={`fields.${index}.landDocumentUrl`}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormControl>
                        <DocumentUploader
                          endpoint="landDocument"
                          label="Land Document"
                          value={field.value}
                          onChange={field.onChange}
                          accept="image/*,.pdf"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
