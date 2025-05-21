'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { ProcessingBatchWithSummary, ExtendedProcessingStageStatus } from './types';
import { Badge } from '@workspace/ui/components/badge';
import { format } from 'date-fns';
import { Checkbox } from '@workspace/ui/components/checkbox';

export const defaultVisibleBatchColumns = [
  'select',
  'batchCode',
  'crop',
  'lotNo',
  'latestStageStatus',
  'latestStageCount',
  'netAvailableQuantity',
  'createdAt',
];

export const batchColumns: ColumnDef<ProcessingBatchWithSummary>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={e => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'batchCode',
    header: 'Batch Code',
    cell: ({ row }) => <div className="font-medium">{row.original.batchCode}</div>,
  },
  {
    accessorKey: 'crop',
    header: 'Crop',
    cell: ({ row }) => row.original.crop,
  },
  {
    accessorKey: 'lotNo',
    header: 'Lot No.',
    cell: ({ row }) => row.original.lotNo,
  },
  {
    accessorKey: 'latestStageCount',
    header: 'Stage (P#)',
    cell: ({ row }) =>
      row.original.latestStageSummary ? `P${row.original.latestStageSummary.processingCount}` : 'N/A',
  },
  {
    accessorKey: 'latestStageStatus',
    header: 'Current Status',
    cell: ({ row }) => {
      const status: ExtendedProcessingStageStatus | undefined = row.original.latestStageSummary?.status;
      if (!status) return <Badge variant="outline">No Stages</Badge>;

      let displayStatus = status.toString().replace(/_/g, ' ');
      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';

      switch (status) {
        case 'IN_PROGRESS':
          variant = 'secondary';
          displayStatus = 'In Progress';
          break;
        case 'FINISHED':
          variant = 'default';
          break;
        case 'SOLD_OUT':
          variant = 'default';
          displayStatus = 'Sold Out';
          break;
        case 'CANCELLED':
          variant = 'destructive';
          break;
        case 'NO_STAGES':
        default:
          variant = 'outline';
          break;
      }
      return <Badge variant={variant}>{displayStatus}</Badge>;
    },
  },
  {
    accessorKey: 'netAvailableQuantity',
    header: 'Avail. from Stage (kg)',
    cell: ({ row }) => <div className="text-right">{row.original.netAvailableQuantity.toFixed(2)}</div>,
  },
  {
    accessorKey: 'initialBatchQuantity',
    header: 'Initial Batch (kg)',
    cell: ({ row }) => <div className="text-right">{row.original.initialBatchQuantity.toFixed(2)}</div>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created On',
    cell: ({ row }) => format(new Date(row.original.createdAt), 'dd/MM/yyyy'),
  },
];
