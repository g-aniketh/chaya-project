import { useAuth } from '@/app/providers/auth-provider';

export function usePermissions() {
  const { user } = useAuth();
  console.log('User in permissions hook: ', user);
  return {
    isAdmin: user?.role === 'ADMIN',
    canCreateFarmer: !!user, // Both admin and staff
    canUpdateFarmer: user?.role === 'ADMIN',
    canDeleteFarmer: user?.role === 'ADMIN',
    canExportData: user?.role === 'ADMIN',
    canManageStaff: user?.role === 'ADMIN',
    canViewDashboard: user?.role === 'ADMIN',
    canViewFarmers: !!user, // Both admin and staff
    canViewProcurement: !!user, // Both admin and staff
    canViewProcessing: !!user, // Both admin and staff
  };
}
