'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnFiltersState,
  getFilteredRowModel,
  SortingState,
  getSortedRowModel,
  RowSelectionState,
} from '@tanstack/react-table';
import { batchColumns, defaultVisibleBatchColumns } from '../lib/columns-batch';
import type { ProcessingBatchWithSummary } from '../lib/types';
import { useProcessingBatchCache } from '../context/processing-batch-cache-context';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { Button } from '@workspace/ui/components/button';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { toast } from 'sonner';
import { RefreshCw, Wind, CheckSquare, ShoppingCart, Layers, Trash2, ArrowUpDown } from 'lucide-react';
import { useAuth } from '@/app/providers/auth-provider';
import { ColumnFilter } from './column-filter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { bulkDeleteProcessingBatchesAction } from '../lib/actions';

import { BatchDetailsDialog } from './dialogs/batch-details-dialog';
import { AddDryingDialog } from './dialogs/add-drying-dialog';
import { FinalizeStageDialog } from './dialogs/finalize-stage-dialog';
import { StartNextStageDialog } from './dialogs/start-next-stage-dialog';
import { RecordSaleDialog } from './dialogs/record-sale-dialog';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ProcessingBatchContextMenu } from './processing-context-menu';

interface ProcessingBatchesTableProps {
  query: string;
  currentPage: number;
  statusFilter: string;
}

export default function ProcessingBatchesTable({ query, currentPage, statusFilter }: ProcessingBatchesTableProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { fetchProcessingBatchesSummary, refreshCurrentPageSummary, clearBatchDetailCache } = useProcessingBatchCache();

  const [records, setRecords] = useState<ProcessingBatchWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [columnVisibility, setColumnVisibility] = useState(() => {
    const initialVisibility: Record<string, boolean> = {};
    defaultVisibleBatchColumns.forEach(colId => {
      initialVisibility[colId] = true;
    });
    batchColumns.forEach(col => {
      if (col.id && initialVisibility[col.id] === undefined && col.enableHiding !== false) {
        initialVisibility[col.id] = true;
      }
    });
    return initialVisibility;
  });

  const [selectedBatchForAction, setSelectedBatchForAction] = useState<ProcessingBatchWithSummary | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAddDryingDialog, setShowAddDryingDialog] = useState(false);
  const [showFinalizeStageDialog, setShowFinalizeStageDialog] = useState(false);
  const [showStartNextStageDialog, setShowStartNextStageDialog] = useState(false);
  const [showRecordSaleDialog, setShowRecordSaleDialog] = useState(false);
  const [showDeleteBatchDialog, setShowDeleteBatchDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(
    async (page: number, q: string, status: string) => {
      setLoading(true);
      try {
        const data = await fetchProcessingBatchesSummary(page, q, status);
        setRecords(data);
      } catch (error) {
        toast.error('Failed to load processing batches.');
      } finally {
        setLoading(false);
      }
    },
    [fetchProcessingBatchesSummary]
  );

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setRowSelection({});
    try {
      const freshData = await refreshCurrentPageSummary(currentPage, query, statusFilter);
      setRecords(freshData);
      toast.success('Data refreshed successfully');
      if (selectedBatchForAction) {
        clearBatchDetailCache(selectedBatchForAction.id);
      }
    } catch (error) {
      toast.error('Failed to refresh data.');
    } finally {
      setRefreshing(false);
    }
  }, [
    refreshing,
    currentPage,
    query,
    statusFilter,
    refreshCurrentPageSummary,
    selectedBatchForAction,
    clearBatchDetailCache,
  ]);

  useEffect(() => {
    fetchData(currentPage, query, statusFilter);
  }, [fetchData, currentPage, query, statusFilter]);

  useEffect(() => {
    const handleDataChange = () => handleRefresh();
    document.addEventListener('processingBatchDataChanged', handleDataChange);
    return () => document.removeEventListener('processingBatchDataChanged', handleDataChange);
  }, [handleRefresh]);

  const table = useReactTable({
    data: records,
    columns: batchColumns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    enableRowSelection: isAdmin,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
  });

  const openDialog = (
    dialogSetter: React.Dispatch<React.SetStateAction<boolean>>,
    batch: ProcessingBatchWithSummary
  ) => {
    setSelectedBatchForAction(batch);
    dialogSetter(true);
  };

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedBatchIds = selectedRows.map(row => row.original.id);
    const batchesWithInProgressStages = selectedRows.filter(
      row => row.original.latestStageSummary?.status === 'IN_PROGRESS'
    );

    if (selectedBatchIds.length === 0) {
      toast.info('No batches selected for deletion.');
      setShowBulkDeleteDialog(false);
      return;
    }
    if (batchesWithInProgressStages.length > 0) {
      toast.error(
        `Cannot delete all selected batches. Batches: ${batchesWithInProgressStages.map(r => r.original.batchCode).join(', ')} have IN_PROGRESS stages. Finalize or cancel them first.`
      );
      setShowBulkDeleteDialog(false);
      return;
    }

    setIsDeleting(true);
    try {
      const result = await bulkDeleteProcessingBatchesAction(selectedBatchIds);
      if (result.success || (result.deletedCount && result.deletedCount > 0)) {
        // Check if deletedCount exists
        toast.success(result.message || `${result.deletedCount || 0} batches deleted successfully.`);
        if (result.errors && result.errors.length > 0) {
          toast.warning(`Some batches could not be deleted: ${result.errors.map(e => e.id).join(', ')}`);
        }
        handleRefresh();
      } else {
        toast.error('Failed to delete selected batches.');
      }
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred during bulk deletion.');
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };
  const selectedCount = Object.keys(rowSelection).length;

  const renderTableSkeleton = () => (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
      <ScrollArea className="rounded-md border h-[calc(100vh-350px)] w-full">
        <Table>
          <TableHeader className="sticky top-0 bg-secondary z-10">
            <TableRow>
              {batchColumns.map((col, idx) => (
                <TableHead key={`skel-head-${idx}`}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
              <TableHead className="sticky right-0 bg-secondary z-10 text-center">
                <Skeleton className="h-4 w-16 mx-auto" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skel-row-${i}`}>
                {batchColumns.map((col, j) => (
                  <TableCell key={`skel-cell-${i}-${j}`}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
                <TableCell className="sticky right-0 bg-background z-0 flex items-center justify-center gap-1 py-1.5">
                  <Skeleton className="h-7 w-7" /> <Skeleton className="h-7 w-7" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );

  if (loading && records.length === 0) {
    return renderTableSkeleton();
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {isAdmin && selectedCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowBulkDeleteDialog(true)}
              disabled={isDeleting}
              className="h-8"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({selectedCount})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="h-8 ml-auto"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <ColumnFilter table={table} />
      </div>
      <ScrollArea className="rounded-md border h-[calc(100vh-350px)] w-full">
        <Table>
          <TableHeader className="sticky top-0 bg-secondary z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder ? null : (
                      <div
                        className={header.column.getCanSort() ? 'cursor-pointer select-none flex items-center' : ''}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                      </div>
                    )}
                  </TableHead>
                ))}
                <TableHead className="sticky right-0 bg-secondary z-10 text-center">Actions</TableHead>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => {
                const batchSummary = row.original;
                const latestStage = batchSummary.latestStageSummary;
                const canPerformStageActions =
                  latestStage && latestStage.status !== 'SOLD_OUT' && latestStage.status !== 'CANCELLED';

                return (
                  <ProcessingBatchContextMenu
                    key={row.id}
                    batch={batchSummary}
                    isAdmin={isAdmin}
                    onViewDetails={() => openDialog(setShowDetailsDialog, batchSummary)}
                    // onEdit={() => { /* TODO: Implement Edit Batch Dialog Trigger */ }}
                  >
                    <TableRow data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} className="whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                      <TableCell className="sticky right-0 bg-background z-0 flex items-center justify-center gap-1 py-1.5">
                        {canPerformStageActions && latestStage.status === 'IN_PROGRESS' && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={e => {
                                e.stopPropagation();
                                openDialog(setShowAddDryingDialog, batchSummary);
                              }}
                              title="Add Drying Data"
                            >
                              {' '}
                              <Wind className="h-4 w-4" />{' '}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={e => {
                                e.stopPropagation();
                                openDialog(setShowFinalizeStageDialog, batchSummary);
                              }}
                              title="Finalize Stage"
                            >
                              {' '}
                              <CheckSquare className="h-4 w-4" />{' '}
                            </Button>
                          </>
                        )}
                        {canPerformStageActions && latestStage.status === 'FINISHED' && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={e => {
                                e.stopPropagation();
                                openDialog(setShowStartNextStageDialog, batchSummary);
                              }}
                              title="Start Next Stage"
                              disabled={batchSummary.netAvailableQuantity <= 0}
                            >
                              {' '}
                              <Layers className="h-4 w-4" />{' '}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={e => {
                                e.stopPropagation();
                                openDialog(setShowRecordSaleDialog, batchSummary);
                              }}
                              title="Record Sale"
                              disabled={batchSummary.netAvailableQuantity <= 0}
                            >
                              {' '}
                              <ShoppingCart className="h-4 w-4" />{' '}
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  </ProcessingBatchContextMenu>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={batchColumns.length + 1 + (isAdmin ? 1 : 0)} className="h-24 text-center">
                  No batches found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {selectedBatchForAction && showDetailsDialog && (
        <BatchDetailsDialog
          batchId={selectedBatchForAction.id}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      )}
      {selectedBatchForAction && selectedBatchForAction.latestStageSummary && showAddDryingDialog && (
        <AddDryingDialog
          processingStageId={selectedBatchForAction.latestStageSummary.id}
          batchCode={selectedBatchForAction.batchCode}
          processingCount={selectedBatchForAction.latestStageSummary.processingCount}
          open={showAddDryingDialog}
          onOpenChange={setShowAddDryingDialog}
          onSuccess={handleRefresh}
        />
      )}
      {selectedBatchForAction && selectedBatchForAction.latestStageSummary && showFinalizeStageDialog && (
        <FinalizeStageDialog
          processingStageId={selectedBatchForAction.latestStageSummary.id}
          batchCode={selectedBatchForAction.batchCode}
          processingCount={selectedBatchForAction.latestStageSummary.processingCount}
          currentInitialQuantity={selectedBatchForAction.latestStageSummary.initialQuantity}
          open={showFinalizeStageDialog}
          onOpenChange={setShowFinalizeStageDialog}
          onSuccess={handleRefresh}
        />
      )}
      {selectedBatchForAction &&
        selectedBatchForAction.latestStageSummary &&
        showStartNextStageDialog &&
        selectedBatchForAction.latestStageSummary.status === 'FINISHED' && (
          <StartNextStageDialog
            processingBatchId={selectedBatchForAction.id}
            batchCode={selectedBatchForAction.batchCode}
            previousStageId={selectedBatchForAction.latestStageSummary.id}
            previousProcessingCount={selectedBatchForAction.latestStageSummary.processingCount}
            previousStageYield={selectedBatchForAction.netAvailableQuantity}
            open={showStartNextStageDialog}
            onOpenChange={setShowStartNextStageDialog}
            onSuccess={handleRefresh}
          />
        )}
      {selectedBatchForAction &&
        selectedBatchForAction.latestStageSummary &&
        showRecordSaleDialog &&
        selectedBatchForAction.latestStageSummary.status === 'FINISHED' && (
          <RecordSaleDialog
            processingBatchId={selectedBatchForAction.id}
            processingStage={{
              id: selectedBatchForAction.latestStageSummary.id,
              processingCount: selectedBatchForAction.latestStageSummary.processingCount,
              quantityAfterProcess: selectedBatchForAction.latestStageSummary.quantityAfterProcess,
              status: selectedBatchForAction.latestStageSummary.status,
            }}
            batchCode={selectedBatchForAction.batchCode}
            availableForSaleFromStage={selectedBatchForAction.netAvailableQuantity}
            open={showRecordSaleDialog}
            onOpenChange={setShowRecordSaleDialog}
            onSuccess={handleRefresh}
          />
        )}

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Batches?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete {selectedCount} batch(es) and unbatch their procurements. Associated stages, drying data,
              and sales will also be removed. This action cannot be undone. Batches with 'IN_PROGRESS' stages cannot be
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
