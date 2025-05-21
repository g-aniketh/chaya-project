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
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ProcurementWithRelations } from '../lib/types';
import { deleteProcurementAction } from '../lib/actions';

interface ProcurementContextMenuProps {
  children: React.ReactNode;
  procurement: ProcurementWithRelations;
  onEdit: () => void;
  isAdmin: boolean;
}

export function ProcurementContextMenu({ children, procurement, onEdit, isAdmin }: ProcurementContextMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleView = () => {
    const event = new CustomEvent('viewProcurement', {
      detail: { procurement },
    });
    document.dispatchEvent(event);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteProcurementAction(procurement.id);

      if (result.success) {
        toast.success('Procurement deleted', {
          description: `Proc. No. ${procurement.procurementNumber} has been successfully deleted.`,
        });

        const dataChangedEvent = new CustomEvent('procurementDataChanged');
        document.dispatchEvent(dataChangedEvent);
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to delete procurement.',
        });
      }

      setShowDeleteDialog(false);
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'An unexpected error occurred while deleting the procurement.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </ContextMenuItem>

          {isAdmin && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Procurement
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Procurement
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this procurement?</AlertDialogTitle>
            <AlertDialogDescription>
              {`This action cannot be undone. This will permanently delete procurement ${procurement.procurementNumber}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
