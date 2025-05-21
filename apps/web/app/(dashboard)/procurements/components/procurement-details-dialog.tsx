'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import type { ProcurementWithRelations } from '../lib/types';
import { format } from 'date-fns';
import { Separator } from '@workspace/ui/components/separator';
import { ScrollArea } from '@workspace/ui/components/scroll-area';

interface ProcurementDetailsDialogProps {
  procurement: ProcurementWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProcurementDetailsDialog({ procurement, open, onOpenChange }: ProcurementDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Procurement Details - {procurement.procurementNumber}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-grow mt-4 pr-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Item Information</h3>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="font-medium text-muted-foreground">Procurement No.:</span>
                  <span>{procurement.procurementNumber}</span>
                  <span className="font-medium text-muted-foreground">Crop:</span>
                  <span>{procurement.crop}</span>
                  <span className="font-medium text-muted-foreground">Procured Form:</span>
                  <span>{procurement.procuredForm}</span>
                  <span className="font-medium text-muted-foreground">Speciality:</span>
                  <span>{procurement.speciality}</span>
                  <span className="font-medium text-muted-foreground">Quantity:</span>
                  <span>{procurement.quantity} kg</span>
                  <span className="font-medium text-muted-foreground">Lot Number:</span>
                  <span>{procurement.lotNo}</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mt-4">Procurement Details</h3>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="font-medium text-muted-foreground">Date:</span>
                  <span>{format(new Date(procurement.date), 'dd/MM/yyyy')}</span>
                  <span className="font-medium text-muted-foreground">Time:</span>
                  <span>{format(new Date(procurement.time), 'hh:mm a')}</span>
                  <span className="font-medium text-muted-foreground">Procured By:</span>
                  <span>{procurement.procuredBy}</span>
                  <span className="font-medium text-muted-foreground">Vehicle Number:</span>
                  <span>{procurement.vehicleNo || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Farmer Information</h3>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="font-medium text-muted-foreground">Name:</span>
                  <span>{procurement.farmer.name}</span>
                  <span className="font-medium text-muted-foreground">Village:</span>
                  <span>{procurement.farmer.village}</span>
                  <span className="font-medium text-muted-foreground">Panchayath:</span>
                  <span>{procurement.farmer.panchayath}</span>
                  <span className="font-medium text-muted-foreground">Mandal:</span>
                  <span>{procurement.farmer.mandal}</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mt-4">System Information</h3>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="font-medium text-muted-foreground">Created At:</span>
                  <span>{format(new Date(procurement.createdAt), 'dd/MM/yyyy hh:mm a')}</span>
                  <span className="font-medium text-muted-foreground">Last Updated:</span>
                  <span>{format(new Date(procurement.updatedAt), 'dd/MM/yyyy hh:mm a')}</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-auto pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
