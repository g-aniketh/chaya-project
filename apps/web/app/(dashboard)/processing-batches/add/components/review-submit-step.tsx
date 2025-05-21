'use client';

import { useProcessingBatchFormStore } from '@/app/stores/processing-batch-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/card';
import { Separator } from '@workspace/ui/components/separator';
import { useMemo } from 'react';
import { format } from 'date-fns';
import type { Procurement } from '@chaya/shared';

interface ProcurementWithFarmerForReview extends Procurement {
  farmer?: { name?: string };
}

export function ReviewAndSubmitStep() {
  const {
    lockedCrop, // Use locked values for review
    lockedLotNo,
    lockedProcuredForm,
    availableProcurements,
    selectedProcurementIds,
    firstStageDetails,
  } = useProcessingBatchFormStore();

  const selectedProcsDetails = useMemo(() => {
    return availableProcurements.filter(p => selectedProcurementIds.includes(p.id));
  }, [availableProcurements, selectedProcurementIds]);

  const totalInitialQuantity = useMemo(() => {
    return selectedProcsDetails.reduce((sum, p) => sum + p.quantity, 0);
  }, [selectedProcsDetails]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 4: Review and Submit</CardTitle>
        <CardDescription>
          Please review all details before creating the processing batch and its first stage (P1).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Batch Criteria</h3>
          <Separator className="my-2" />
          <div className="grid grid-cols-2 gap-2">
            <p className="font-medium">Crop:</p>
            <p>{lockedCrop || 'Not Set'}</p>
            <p className="font-medium">Lot Number:</p>
            <p>{lockedLotNo || 'Not Set'}</p>
            <p className="font-medium">Procured Form:</p>
            <p>{lockedProcuredForm || 'Not Set'}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold">Selected Procurements ({selectedProcurementIds.length})</h3>
          <Separator className="my-2" />
          {selectedProcsDetails.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
              {selectedProcsDetails.map(p => (
                <li key={p.id}>
                  Proc. No: {p.procurementNumber} - {p.quantity}kg - Farmer:{' '}
                  {(p as ProcurementWithFarmerForReview).farmer?.name || 'N/A'}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No procurements selected.</p>
          )}
          <p className="font-semibold mt-2">Total Initial Batch Quantity: {totalInitialQuantity.toFixed(2)} kg</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold">First Stage (P1) Details</h3>
          <Separator className="my-2" />
          <div className="grid grid-cols-2 gap-2">
            <p className="font-medium">Process Method:</p>
            <p>{firstStageDetails.processMethod}</p>
            <p className="font-medium">Date of Processing:</p>
            <p>
              {firstStageDetails.dateOfProcessing
                ? format(new Date(firstStageDetails.dateOfProcessing), 'PPP')
                : 'Not set'}
            </p>
            <p className="font-medium">Done By:</p>
            <p>{firstStageDetails.doneBy}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
