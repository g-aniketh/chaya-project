'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Package, BarChart, LogOut, Leaf, ChevronLeft, Menu } from 'lucide-react';
import { useAuth } from '@/app/providers/auth-provider';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/components/button';

const baseNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: Home, adminOnly: true },
  { title: 'Farmer Details', href: '/farmers', icon: Leaf, adminOnly: false },
  { title: 'Procurement', href: '/procurements', icon: Package, adminOnly: false },
  { title: 'Processing Batches', href: '/processing-batches', icon: BarChart, adminOnly: false },
];

const adminNavItems = [{ title: 'Staff Management', href: '/staff', icon: Users, adminOnly: true }];

const MIN_WIDTH = 60;
const MAX_WIDTH = 280;
const DEFAULT_WIDTH = 200;

export function AppSidebar(props: React.HTMLAttributes<HTMLDivElement>) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(true);
  const [sidebarWidth, setSidebarWidth] = React.useState(MIN_WIDTH);
  const [isResizing, setIsResizing] = React.useState(false);

  const isRouteActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const navItems = React.useMemo(() => {
    let items = [...baseNavItems];
    if (user?.role === 'ADMIN') {
      items = items.concat(adminNavItems);
    }
    items = items.filter(item => !item.adminOnly || (item.adminOnly && user?.role === 'ADMIN'));
    return items;
  }, [user]);

  React.useEffect(() => {
    try {
      const storedCollapsed = localStorage.getItem('sidebar-collapsed');
      const storedWidth = localStorage.getItem('sidebar-width');

      setCollapsed(storedCollapsed ? JSON.parse(storedCollapsed) : false);
      setSidebarWidth(storedWidth ? Math.max(MIN_WIDTH, Math.min(JSON.parse(storedWidth), MAX_WIDTH)) : DEFAULT_WIDTH);
    } catch (error) {
      console.error('Error loading sidebar state:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
    localStorage.setItem('sidebar-width', JSON.stringify(sidebarWidth));
  }, [collapsed, sidebarWidth, isLoaded]);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      let newWidth = e.clientX;
      newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH));
      setSidebarWidth(newWidth);

      if (newWidth < MIN_WIDTH + 20 && !collapsed) {
        setCollapsed(true);
      } else if (newWidth > MIN_WIDTH + 50 && collapsed) {
        setCollapsed(false);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, collapsed]);

  if (!isLoaded || !user) {
    // Add !user check here to avoid rendering sidebar before user is loaded
    return (
      <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-md" style={{ width: MIN_WIDTH }}>
        <div className="flex items-center justify-center h-16 border-b">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* ... rest of skeleton ... */}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full bg-white border-r  shadow-md relative group transition-all duration-300 ease-in-out"
      style={{ width: collapsed ? MIN_WIDTH : sidebarWidth }}
      {...props}
    >
      <div className="flex items-center justify-between h-16 border-b border-gray-200 px-4 bg-gray-100">
        {!collapsed && (
          <div className="text-xl font-bold text-green-600 whitespace-nowrap transition-opacity duration-200 ease-in-out">
            Chaya
          </div>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleCollapse}
          className="h-8 w-8 ml-1 border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu className="h-4 w-4 text-gray-600" /> : <ChevronLeft className="h-4 w-4 text-gray-600" />}
        </Button>
      </div>

      <div className="flex flex-1 flex-col justify-between overflow-hidden">
        <nav className="p-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            // Condition to render item:
            // Render if not adminOnly, OR if adminOnly and user is ADMIN
            if (!item.adminOnly || (item.adminOnly && user?.role === 'ADMIN')) {
              const active = isRouteActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200',
                    active
                      ? 'bg-green-100 text-green-800 border-l-4 border-green-600'
                      : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent',
                    collapsed ? 'justify-center' : ''
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="whitespace-nowrap transition-opacity duration-200">{item.title}</span>
                  )}
                </Link>
              );
            }
            return null; // Don't render if adminOnly and user is not admin
          })}
        </nav>

        <div className="p-2  border-t border-gray-200 ">
          <button
            onClick={signOut}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-red-600 rounded-md hover:bg-red-50 w-full transition-all duration-200 border border-transparent hover:border-red-200',
              collapsed ? 'justify-center' : ''
            )}
            title={collapsed ? 'Log Out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap transition-opacity duration-200">Log Out</span>}
          </button>
        </div>
      </div>

      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-gray-300 hover:w-2 hover:bg-green-300 active:w-3 active:bg-green-400 transition-all duration-200"
        onMouseDown={startResize}
      />
    </div>
  );
}
