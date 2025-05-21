'use client';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Separator } from '@workspace/ui/components/separator';
import { format } from 'date-fns';
import type { ProcurementFullFormValues } from '@/app/stores/procurement-form';

export function ReviewSection() {
  const { getValues } = useFormContext<ProcurementFullFormValues>();
  const formValues = getValues();

  if (!formValues) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Form data not available for review.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Farmer ID:</p>
                <p className="text-sm">{formValues.farmerId || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Crop:</p>
                <p className="text-sm">{formValues.crop || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Procured Form:</p>
                <p className="text-sm">{formValues.procuredForm || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Speciality:</p>
                <p className="text-sm">{formValues.speciality || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Quantity:</p>
                <p className="text-sm">{formValues.quantity !== undefined ? `${formValues.quantity} kg` : 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Procurement Details</h3>
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Date:</p>
                <p className="text-sm">
                  {formValues.date ? format(new Date(formValues.date), 'dd/MM/yyyy') : 'Not set'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Time:</p>
                <p className="text-sm">{formValues.time || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Lot Number:</p>
                <p className="text-sm">{formValues.lotNo || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Procured By:</p>
                <p className="text-sm">{formValues.procuredBy || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Vehicle Number:</p>
                <p className="text-sm">{formValues.vehicleNo || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              Please review the information above before submitting. A procurement number will be automatically
              generated.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
