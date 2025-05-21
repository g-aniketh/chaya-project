import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Button } from '@workspace/ui/components/button';
import { formatDate } from './utils';
import { Farmer } from '@chaya/shared';
import { Eye, FileUser } from 'lucide-react';

export const columns: ColumnDef<Farmer>[] = [
  {
    id: 'select',
    header: ({ table }) => {
      return (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      );
    },
    cell: ({ row }) => {
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'surveyNumber',
    header: 'Survey Number',
    cell: ({ row }) => <div>{row.getValue('surveyNumber')}</div>,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <div>{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'gender',
    header: 'Gender',
    cell: ({ row }) => <div>{row.getValue('gender')}</div>,
  },
  {
    accessorKey: 'age',
    header: 'Age',
    cell: ({ row }) => <div>{row.getValue('age')}</div>,
  },
  {
    accessorKey: 'contactNumber',
    header: 'Contact',
    cell: ({ row }) => <div>{row.getValue('contactNumber')}</div>,
  },
  {
    accessorKey: 'aadharNumber',
    header: 'Aadhar Number',
    cell: ({ row }) => <div>{row.getValue('aadharNumber')}</div>,
  },
  {
    accessorKey: 'village',
    header: 'Village',
    cell: ({ row }) => <div>{row.getValue('village')}</div>,
  },
  {
    accessorKey: 'district',
    header: 'District',
    cell: ({ row }) => <div>{row.getValue('district')}</div>,
  },
  {
    accessorKey: 'state',
    header: 'State',
    cell: ({ row }) => <div>{row.getValue('state')}</div>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => <div>{formatDate(row.getValue('createdAt'))}</div>,
  },
  {
    id: 'actions',
    header: 'Documents',
    cell: ({ row }) => {
      const farmer = row.original;
      return (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={e => {
              e.stopPropagation();
              const viewFarmerEvent = new CustomEvent('viewFarmer', {
                detail: { farmer },
              });
              document.dispatchEvent(viewFarmerEvent);
            }}
          >
            <span className="sr-only">View details</span>
            <FileUser className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

export const defaultVisibleColumns = [
  'select',
  'surveyNumber',
  'name',
  'aadharNumber',
  'village',
  'district',
  'actions',
];
