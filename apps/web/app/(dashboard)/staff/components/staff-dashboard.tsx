'use client';

import { useState } from 'react';
import { StaffTable } from './staff-table';
import { AddStaffDialog } from './add-staff-dialog';
import { Button } from '@workspace/ui/components/button';
import { UserPlus } from 'lucide-react';
// import { useAuth } from '@/app/providers/auth-provider';

export function StaffDashboard() {
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  // const { user } = useAuth();
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold">Staff Members</h2>
        <Button onClick={() => setIsAddStaffOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      <StaffTable />

      <AddStaffDialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen} />
    </div>
  );
}
