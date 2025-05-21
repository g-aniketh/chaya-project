'use client';

import React, { useState } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@workspace/ui/components/context-menu';
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
import { Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ProcessingBatchWithSummary } from '../lib/types';
import { deleteProcessingBatchAction } from '../lib/actions';

interface ProcessingBatchContextMenuProps {
  children: React.ReactNode;
  batch: ProcessingBatchWithSummary;
  onViewDetails: () => void;
  isAdmin: boolean;
}

export function ProcessingBatchContextMenu({
  children,
  batch,
  onViewDetails,
  isAdmin,
}: ProcessingBatchContextMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteProcessingBatchAction(batch.id);

      if (result.success) {
        toast.success(result.message || `Batch ${batch.batchCode} deleted successfully.`);
        document.dispatchEvent(new CustomEvent('processingBatchDataChanged'));
      } else {
        toast.error(result.error || 'Failed to delete batch.');
      }
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred while deleting the batch.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={onViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </ContextMenuItem>

          {isAdmin && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => {
                  if (batch.latestStageSummary?.status === 'IN_PROGRESS') {
                    toast.error('Cannot delete batch with IN_PROGRESS stages. Finalize or cancel them first.');
                    return;
                  }
                  setShowDeleteDialog(true);
                }}
                className="text-destructive focus:text-destructive"
                disabled={batch.latestStageSummary?.status === 'IN_PROGRESS'}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Batch
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Batch: {batch.batchCode}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible. Procurements will be unbatched. All associated processing stages, drying
              data, and sales for this batch will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Batch'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
