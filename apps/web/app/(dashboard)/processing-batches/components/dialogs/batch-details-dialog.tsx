'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@workspace/ui/components/dialog';
import type {
  ProcessingBatchWithDetails,
  ExtendedProcessingStageStatus,
  ProcessingStageWithDetails,
} from '../../lib/types';
import { useProcessingBatchCache } from '../../context/processing-batch-cache-context';
import { Separator } from '@workspace/ui/components/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { Badge } from '@workspace/ui/components/badge';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { format } from 'date-fns';
import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';

interface BatchDetailsDialogProps {
  batchId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BatchDetailsDialog({ batchId, open, onOpenChange }: BatchDetailsDialogProps) {
  const { getBatchDetails } = useProcessingBatchCache();
  const [batch, setBatch] = useState<ProcessingBatchWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && batchId) {
      setIsLoading(true);
      setBatch(null);
      getBatchDetails(batchId)
        .then(data => {
          if (data) {
            setBatch(data);
          } else {
            console.error(`BatchDetailsDialog: Batch data for ID ${batchId} not found or failed to load.`);
          }
        })
        .catch(err => {
          console.error('Error fetching batch details for dialog:', err);
          setBatch(null);
        })
        .finally(() => setIsLoading(false));
    } else if (!open) {
      setBatch(null);
    }
  }, [open, batchId, getBatchDetails]);

  const getStatusBadgeVariant = (
    status?: ExtendedProcessingStageStatus
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (!status) return 'outline';
    switch (status) {
      case 'IN_PROGRESS':
        return 'secondary';
      case 'FINISHED':
      case 'SOLD_OUT':
        return 'default';
      case 'CANCELLED':
        return 'destructive';
      case 'NO_STAGES':
      default:
        return 'outline';
    }
  };

  const displayedOverallStatus = batch?.latestStageSummary?.status || 'NO_STAGES';

  const renderSkeleton = () => (
    <>
      <DialogHeader className="p-6 pb-4 border-b">
        {' '}
        {/* Ensure header is always present */}
        <DialogTitle>
          <Skeleton className="h-7 w-3/5 mb-1" />
        </DialogTitle>
        <DialogDescription>
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-4/5" />
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="flex-grow overflow-y-auto px-6 py-4">
        <div className="space-y-5">
          <div>
            <h3 className="text-md font-semibold mb-1.5">
              <Skeleton className="h-5 w-1/4" />
            </h3>
            <Separator className="my-1" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2 p-3 border rounded-md bg-muted/20">
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div>
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-1.5">
              <Skeleton className="h-5 w-1/3" />
            </h3>
            <Separator className="my-1" />
            <div className="mt-2 border rounded-md max-h-48 overflow-y-auto p-2 space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-1.5">
              <Skeleton className="h-5 w-1/4" />
            </h3>
            <Separator className="my-1" />
            <div className="mt-2.5 border p-3 rounded-md bg-card shadow-sm space-y-2">
              <Skeleton className="h-4 w-1/2 mb-1" />
              <Skeleton className="h-3 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2 mb-1" />
              <div className="border rounded-md max-h-32 overflow-y-auto p-2 space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
      <DialogFooter className="p-6 pt-4 border-t">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled>
          Close
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        {isLoading || (!batch && open) ? (
          renderSkeleton()
        ) : !batch ? (
          <>
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Error Loading Batch</DialogTitle> {/* Always provide a title */}
              <DialogDescription>Could not load batch details. Please try again.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="p-6 pt-2 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="p-6 pb-4 border-b">
              <DialogTitle>Batch Details: {batch.batchCode}</DialogTitle>
              <DialogDescription className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm pt-1">
                <span>
                  Crop: <span className="font-semibold">{batch.crop}</span>
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span>
                  Lot No: <span className="font-semibold">{batch.lotNo}</span>
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span>
                  Created By: <span className="font-semibold">{batch.createdBy.name}</span>
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span>
                  On: <span className="font-semibold">{format(new Date(batch.createdAt), 'PP')}</span>
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span>Overall Status:</span>
                <Badge variant={getStatusBadgeVariant(displayedOverallStatus)} className="ml-1">
                  {displayedOverallStatus.toString().replace(/_/g, ' ')}
                </Badge>
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-grow overflow-y-auto px-6 py-4">
              <div className="space-y-5">
                {/* Key Figures Section */}
                <div>
                  <h3 className="text-md font-semibold mb-1.5">Key Figures</h3>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2 text-sm p-3 border rounded-md bg-muted/20">
                    <div>
                      <span className="text-xs text-muted-foreground block">Initial Batch Qty:</span>{' '}
                      {/* Use span or div instead of p */}
                      <span className="font-semibold block">{batch.initialBatchQuantity.toFixed(2)} kg</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Total Sold from Batch:</span>
                      <span className="font-semibold block">{batch.totalQuantitySoldFromBatch.toFixed(2)} kg</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Net Available (latest stage):</span>
                      <span className="font-bold text-green-600 block">{batch.netAvailableQuantity.toFixed(2)} kg</span>
                    </div>
                  </div>
                </div>

                {/* Procurements Section */}
                <div>
                  <h3 className="text-md font-semibold mb-1.5">
                    Procurements Included ({batch.procurements?.length || 0})
                  </h3>
                  <Separator />
                  {batch.procurements && batch.procurements.length > 0 ? (
                    <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                      <Table className="text-xs">
                        <TableHeader className="sticky top-0 bg-muted/50 z-10">
                          <TableRow>
                            <TableHead className="py-1.5">Proc. No.</TableHead>
                            <TableHead className="py-1.5">Farmer</TableHead>
                            <TableHead className="py-1.5">Village</TableHead>
                            <TableHead className="text-right py-1.5">Qty (kg)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {batch.procurements.map(p => (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium py-1.5">{p.procurementNumber}</TableCell>
                              <TableCell className="py-1.5">{p.farmer.name}</TableCell>
                              <TableCell className="py-1.5">{p.farmer.village || 'N/A'}</TableCell>
                              <TableCell className="text-right py-1.5">{p.quantity.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground mt-2 text-center py-3">No procurements linked.</div> // Use div
                  )}
                </div>

                {/* Processing Stages Section */}
                <div>
                  <h3 className="text-md font-semibold mb-1.5">
                    Processing Stages ({batch.processingStages?.length || 0})
                  </h3>
                  <Separator />
                  {batch.processingStages && batch.processingStages.length > 0 ? (
                    batch.processingStages.map((stage: ProcessingStageWithDetails) => (
                      <div key={stage.id} className="mt-2.5 border p-3 rounded-md bg-card shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h4 className="font-semibold text-sm">
                              Stage P{stage.processingCount}
                              <Badge
                                variant={getStatusBadgeVariant(stage.status as ExtendedProcessingStageStatus)}
                                className="ml-2 text-xs px-1.5 py-0.5"
                              >
                                {stage.status.replace(/_/g, ' ')}
                              </Badge>
                            </h4>
                            <div className="text-xs text-muted-foreground">
                              Method: {stage.processMethod.toUpperCase()} | By: {stage.doneBy}
                            </div>{' '}
                            {/* Use div */}
                          </div>
                          <div className="text-xs text-muted-foreground text-right">
                            <div>Started: {format(new Date(stage.dateOfProcessing), 'dd/MM/yy HH:mm')}</div>{' '}
                            {/* Use div */}
                            {stage.dateOfCompletion ? (
                              <div>Completed: {format(new Date(stage.dateOfCompletion), 'dd/MM/yy HH:mm')}</div>
                            ) : (
                              ''
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 text-xs mb-1.5">
                          <div>
                            <span className="text-muted-foreground">Initial Qty:</span>{' '}
                            {stage.initialQuantity.toFixed(2)}kg
                          </div>{' '}
                          {/* Use div */}
                          {stage.quantityAfterProcess !== null && (
                            <div>
                              <span className="text-muted-foreground">Stage Yield:</span>{' '}
                              {stage.quantityAfterProcess.toFixed(2)}kg
                            </div>
                          )}
                        </div>

                        {stage.dryingEntries?.length > 0 && (
                          <div className="mt-1.5">
                            <div className="text-xs font-medium mb-0.5">
                              Drying Entries ({stage.dryingEntries.length}):
                            </div>{' '}
                            {/* Use div */}
                            <div className="border rounded-md max-h-32 overflow-y-auto">
                              <Table className="text-xs">
                                <TableHeader className="sticky top-0 bg-muted/50 z-10">
                                  <TableRow>
                                    <TableHead className="py-1">Day</TableHead>
                                    <TableHead className="py-1">Temp</TableHead>
                                    <TableHead className="py-1">Humid</TableHead>
                                    <TableHead className="py-1">pH</TableHead>
                                    <TableHead className="py-1">Moist%</TableHead>
                                    <TableHead className="text-right py-1">Qty(kg)</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {stage.dryingEntries.map(d => (
                                    <TableRow key={d.id}>
                                      <TableCell className="py-1">{d.day}</TableCell>
                                      <TableCell className="py-1">{d.temperature}°C</TableCell>
                                      <TableCell className="py-1">{d.humidity}%</TableCell>
                                      <TableCell className="py-1">{d.pH}</TableCell>
                                      <TableCell className="py-1">{d.moisturePercentage}%</TableCell>
                                      <TableCell className="text-right py-1">{d.currentQuantity.toFixed(2)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                        {(!stage.dryingEntries || stage.dryingEntries.length === 0) &&
                          stage.status === 'IN_PROGRESS' && (
                            <div className="text-xs text-muted-foreground mt-1 text-center py-1.5">
                              No drying entries for this stage.
                            </div> // Use div
                          )}

                        {stage.sales?.length > 0 && (
                          <div className="mt-1.5">
                            <div className="text-xs font-medium mb-0.5">
                              Sales from P{stage.processingCount} ({stage.sales.length}):
                            </div>{' '}
                            {/* Use div */}
                            <div className="border rounded-md max-h-28 overflow-y-auto">
                              <Table className="text-xs">
                                <TableHeader className="sticky top-0 bg-muted/50 z-10">
                                  <TableRow>
                                    <TableHead className="py-1">Sale Date</TableHead>
                                    <TableHead className="text-right py-1">Qty Sold</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {stage.sales.map(s => (
                                    <TableRow key={s.id}>
                                      <TableCell className="py-1">{format(new Date(s.dateOfSale), 'PP')}</TableCell>
                                      <TableCell className="text-right py-1">{s.quantitySold.toFixed(2)}kg</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground mt-2 text-center py-3">
                      No processing stages recorded yet.
                    </div> // Use div
                  )}
                </div>

                {/* All Sales Section */}
                <div>
                  <h3 className="text-md font-semibold mb-1.5">All Sales From Batch ({batch.sales?.length || 0})</h3>
                  <Separator />
                  {batch.sales && batch.sales.length > 0 ? (
                    <div className="mt-2 border rounded-md max-h-32 overflow-y-auto">
                      <Table className="text-xs">
                        <TableHeader className="sticky top-0 bg-muted/50 z-10">
                          <TableRow>
                            <TableHead className="py-1.5">Sale Date</TableHead>
                            <TableHead className="py-1.5">From Stage</TableHead>
                            <TableHead className="text-right py-1.5">Qty Sold (kg)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {batch.sales.map(s => (
                            <TableRow key={s.id}>
                              <TableCell className="py-1.5">{format(new Date(s.dateOfSale), 'PP')}</TableCell>
                              <TableCell className="py-1.5">P{s.processingStage.processingCount}</TableCell>
                              <TableCell className="text-right py-1.5">{s.quantitySold.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground mt-2 text-center py-3">
                      No sales recorded for this batch yet.
                    </div> // Use div
                  )}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
