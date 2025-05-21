'use client';

import React, { useState } from 'react';
import { Farmer } from '@chaya/shared';
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
import { deleteFarmer } from '../lib/actions';
import { toast } from 'sonner';

interface FarmerContextMenuProps {
  children: React.ReactNode;
  farmer: Farmer;
  onEdit: () => void;
  isAdmin: boolean;
}

export function FarmerContextMenu({ children, farmer, onEdit, isAdmin }: FarmerContextMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteFarmer(farmer.id);

      if (result.success) {
        toast.success('Farmer deleted', {
          description: `${farmer.name} has been successfully deleted.`,
        });

        const dataChangedEvent = new CustomEvent('farmerDataChanged');
        document.dispatchEvent(dataChangedEvent);
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to delete farmer.',
        });
      }

      setShowDeleteDialog(false);
    } catch (error) {
      toast.error('Error', {
        description: 'An unexpected error occurred while deleting the farmer.',
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
          <ContextMenuItem onClick={() => window.open(`/dashboard/farmers/${farmer.id}`, '_blank')}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </ContextMenuItem>

          {isAdmin && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Farmer
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Farmer
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this farmer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the farmer record and all associated data.
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
