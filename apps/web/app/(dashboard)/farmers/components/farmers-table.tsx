'use client';

import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { columns, defaultVisibleColumns } from '../lib/columns';
import { ColumnFilter } from './column-filter';
import { useState, useEffect } from 'react';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { useAuth } from '@/app/providers/auth-provider';
import { FarmerContextMenu } from './farmer-context-menu';
import { FarmerDetailsDialog } from './farmer-details-dialog';
import { FarmerFormDialog } from './farmer-form-dialog';
import { bulkDeleteFarmers } from '../lib/actions';
import { Button } from '@workspace/ui/components/button';
import { RefreshCw, TrashIcon } from 'lucide-react';
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
import { toast } from 'sonner';
import { useFarmersCache } from '../context/farmer-cache-context';
import { FarmerWithRelations } from '../lib/types';

interface FarmersTableProps {
  query: string;
  currentPage: number;
}

export default function FarmersTable({ query, currentPage }: FarmersTableProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { fetchFarmers, prefetchPages, refreshCurrentPage } = useFarmersCache();

  const [farmers, setFarmers] = useState<FarmerWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [viewingFarmer, setViewingFarmer] = useState<FarmerWithRelations | null>(null);
  const [editingFarmer, setEditingFarmer] = useState<FarmerWithRelations | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [rowSelection, setRowSelection] = useState({});

  const [columnVisibility, setColumnVisibility] = useState(() => {
    const initialVisibility: Record<string, boolean> = {};
    defaultVisibleColumns.forEach(col => {
      initialVisibility[col] = true;
    });
    return initialVisibility;
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchFarmers(currentPage, query);
      setFarmers(data);

      const pagesToPrefetch = [];
      if (currentPage > 1) pagesToPrefetch.push(currentPage - 1);
      if (currentPage < 100) pagesToPrefetch.push(currentPage + 1);
      if (pagesToPrefetch.length > 0) {
        prefetchPages(Math.min(...pagesToPrefetch), Math.max(...pagesToPrefetch), query);
      }
    } catch (error) {
      toast.error("Failed to fetch farmers' data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      const freshData = await refreshCurrentPage(currentPage, query);
      setFarmers(freshData);
      toast.success('Data refreshed successfully');
      setRowSelection({});
    } catch (error) {
      toast.error('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [fetchFarmers, prefetchPages, currentPage, query]);

  const table = useReactTable({
    data: farmers,
    columns,
    state: {
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: isAdmin,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleViewDetails = (farmer: FarmerWithRelations) => {
    setViewingFarmer(farmer);
    setShowViewDialog(true);
  };

  const handleEditFarmer = (farmer: FarmerWithRelations) => {
    if (isAdmin) {
      setEditingFarmer(farmer);
      setShowEditDialog(true);
    } else {
      toast.error('You do not have permission to edit farmers.');
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const selectedFarmerIds = Object.keys(rowSelection)
        .map(index => {
          const idx = parseInt(index);
          return idx >= 0 && idx < farmers.length && farmers[idx] ? farmers[idx].id : null;
        })
        .filter((id): id is number => id !== null);

      if (selectedFarmerIds.length === 0) {
        toast.error('No farmers selected for deletion.');
        setShowBulkDeleteDialog(false);
        return;
      }

      const result = await bulkDeleteFarmers(selectedFarmerIds);

      if (result.success) {
        toast.success('Farmers deleted successfully.');
        await handleRefresh();
      } else {
        toast.error('Failed to delete farmers. Please try again.');
      }

      setShowBulkDeleteDialog(false);
    } catch (error) {
      toast.error('Failed to delete farmers. An unexpected error occurred.');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const handleViewFarmerEvent = (e: CustomEvent<{ farmer: FarmerWithRelations }>) => {
      handleViewDetails(e.detail.farmer);
    };
    const handleDataChangeEvent = () => {
      handleRefresh();
    };

    document.addEventListener('viewFarmer', handleViewFarmerEvent as EventListener);
    document.addEventListener('farmerDataChanged', handleDataChangeEvent as EventListener);

    return () => {
      document.removeEventListener('viewFarmer', handleViewFarmerEvent as EventListener);
      document.removeEventListener('farmerDataChanged', handleDataChangeEvent as EventListener);
    };
  }, [currentPage, query]);

  const selectedCount = Object.keys(rowSelection).length;

  if (loading && farmers.length === 0) {
    return (
      <div className="mt-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-28 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="rounded-md border">
          <div className="h-12 border-b bg-secondary px-4 flex items-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-32 mx-4 animate-pulse"></div>
            ))}
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="border-b px-4 py-4 flex items-center">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="h-4 bg-gray-200 rounded w-32 mx-4 animate-pulse"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {isAdmin && selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selectedCount} selected</span>
              <Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteDialog(true)} className="h-8">
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="h-8 ml-2"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <ColumnFilter table={table} />
      </div>
      <div className="rounded-md border overflow-x-auto">
        <ScrollArea className="h-[calc(100vh-350px)] w-full">
          <Table className="min-w-max">
            <TableHeader className="sticky top-0 bg-secondary">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <FarmerContextMenu
                    key={row.id}
                    farmer={row.original}
                    onEdit={() => handleEditFarmer(row.original)}
                    isAdmin={isAdmin}
                  >
                    <TableRow
                      data-state={row.getIsSelected() && 'selected'}
                      onDoubleClick={() => handleViewDetails(row.original)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  </FarmerContextMenu>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {loading || refreshing ? 'Loading...' : 'No farmers found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {viewingFarmer && (
        <FarmerDetailsDialog farmer={viewingFarmer} open={showViewDialog} onOpenChange={setShowViewDialog} />
      )}

      {isAdmin && editingFarmer && (
        <FarmerFormDialog mode="edit" farmer={editingFarmer} open={showEditDialog} onOpenChange={setShowEditDialog} />
      )}

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete these farmers?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedCount} farmer records and all their
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
