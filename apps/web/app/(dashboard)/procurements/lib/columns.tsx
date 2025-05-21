'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@workspace/ui/components/checkbox';
import type { ProcurementWithRelations } from './types';
import { format } from 'date-fns';

export const defaultVisibleColumns = [
  'select',
  'procurementNumber',
  'crop',
  'farmerName',
  'quantity',
  'date',
  'procuredBy',
];

export const columns: ColumnDef<ProcurementWithRelations>[] = [
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
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'procurementNumber',
    header: 'Proc. Number',
    cell: ({ row }) => <div className="font-medium">{row.getValue('procurementNumber')}</div>,
  },
  {
    accessorKey: 'crop',
    header: 'Crop',
    cell: ({ row }) => <div>{row.getValue('crop')}</div>,
  },
  {
    accessorKey: 'farmerName',
    header: 'Farmer',
    cell: ({ row }) => <div>{row.original.farmer.name}</div>,
  },
  {
    accessorKey: 'procuredForm',
    header: 'Form',
    cell: ({ row }) => <div>{row.getValue('procuredForm')}</div>,
  },
  {
    accessorKey: 'speciality',
    header: 'Speciality',
    cell: ({ row }) => <div>{row.getValue('speciality')}</div>,
  },
  {
    accessorKey: 'quantity',
    header: 'Quantity',
    cell: ({ row }) => <div>{row.getValue('quantity')} kg</div>,
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => <div>{format(new Date(row.original.date), 'dd/MM/yyyy')}</div>,
  },
  {
    accessorKey: 'time',
    header: 'Time',
    cell: ({ row }) => <div>{format(new Date(row.original.time), 'hh:mm a')}</div>,
  },
  {
    accessorKey: 'lotNo',
    header: 'Lot No',
    cell: ({ row }) => <div>{row.getValue('lotNo')}</div>,
  },
  {
    accessorKey: 'procuredBy',
    header: 'Procured By',
    cell: ({ row }) => <div>{row.getValue('procuredBy')}</div>,
  },
  {
    accessorKey: 'vehicleNo',
    header: 'Vehicle No',
    cell: ({ row }) => <div>{row.getValue('vehicleNo')}</div>,
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => (
      <div>
        {row.original.farmer.village}, {row.original.farmer.panchayath}, {row.original.farmer.mandal}
      </div>
    ),
  },
];
