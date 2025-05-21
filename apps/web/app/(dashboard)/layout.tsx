'use client';

import React, { useEffect } from 'react';
import { ThemeProvider } from '@/app/providers/theme-provider';
import { AuthProvider, useAuth } from '@/app/providers/auth-provider';
import { SidebarProvider } from '@workspace/ui/components/sidebar';
import { AppSidebar } from '../components/layout/app-sidebar';
import { FarmersCacheProvider } from './farmers/context/farmer-cache-context';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
import { motion } from 'framer-motion';
import { Toaster } from 'sonner';

// Content that requires authentication and role checks
function AuthenticatedContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      // This case should ideally be handled by middleware redirecting to /login
      // but as a fallback.
      router.push('/login');
      return;
    }

    if (!loading && user) {
      // Staff-specific redirections
      if (user.role === 'STAFF') {
        if (pathname.startsWith('/staff') || pathname.startsWith('/dashboard')) {
          router.push('/farmers'); // Default page for staff
        }
      }
      // Admin specific: can access anything in dashboard layout.
    }
  }, [user, loading, router, pathname]);

  // Render null or a loading indicator if still loading or if user is null and redirecting
  if (loading || (!user && pathname !== '/login')) {
    return <div className="flex h-screen w-screen items-center justify-center">Loading application...</div>;
  }

  // If user is STAFF and tries to access restricted pages, they would have been redirected.
  // So, if we reach here, they are allowed (or an Admin).
  if (user?.role === 'STAFF' && (pathname.startsWith('/staff') || pathname.startsWith('/dashboard'))) {
    return null; // Or a specific "Access Denied" component for staff
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <SidebarProvider>
        <AppSidebar className="h-screen" />
        <motion.div
          className="flex flex-col flex-1 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-1 flex-col p-4 overflow-auto">{children}</div>
        </motion.div>
      </SidebarProvider>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <FarmersCacheProvider>
          <AuthenticatedContent>{children}</AuthenticatedContent>
        </FarmersCacheProvider>
      </AuthProvider>
      <Toaster richColors closeButton />
    </ThemeProvider>
  );
}
