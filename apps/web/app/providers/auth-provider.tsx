'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { clearSidebarCache } from '../(dashboard)/farmers/lib/sidebar-cache';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUserStateOnly: (user: User | null) => void;
  signOut: () => Promise<void>;
  triggerSessionCheck: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUserStateOnly: () => {},
  signOut: async () => {},
  triggerSessionCheck: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionCheckTrigger, setSessionCheckTrigger] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

  const triggerSessionCheck = useCallback(() => {
    console.log('[AuthProvider] triggerSessionCheck called. Current trigger value:', sessionCheckTrigger);
    setSessionCheckTrigger(prev => {
      const next = prev + 1;
      console.log('[AuthProvider] sessionCheckTrigger updated to:', next);
      return next;
    });
  }, [sessionCheckTrigger]); // sessionCheckTrigger was missing from deps, might be an issue if useCallback memoized old value

  const setUserStateOnly = useCallback((newUser: User | null) => {
    setUser(newUser);
  }, []);

  useEffect(() => {
    console.log(`[AuthProvider] useEffect running. Pathname: ${pathname}, Trigger: ${sessionCheckTrigger}`);

    async function loadUserFromServer() {
      console.log('[AuthProvider] loadUserFromServer called.');
      setLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        console.log(`[AuthProvider] /me request sent. Status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          console.log('[AuthProvider] User loaded from /me:', data.user);
          setUser(data.user); // Set user state
          if (data.user && pathname === '/login') {
            console.log('[AuthProvider] User is set AND on /login page. Redirecting to /dashboard.');
            router.push('/dashboard');
          } else if (data.user) {
            console.log('[AuthProvider] User is set, but not on /login page. Pathname:', pathname);
          } else {
            console.log('[AuthProvider] /me was ok, but no user data received.');
            setUser(null); // Ensure user is null if API response is weird
          }
        } else {
          console.log('[AuthProvider] Failed to fetch user from /me. Status:', response.status);
          setUser(null); // Clear user if /me fails
          if (response.status === 401 && !pathname.startsWith('/login') && pathname !== '/') {
            // Avoid redirect loop from home if it becomes protected
            console.log('[AuthProvider] /me failed (401), not on /login page. Redirecting to /login.');
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('[AuthProvider] Error fetching user from /me:', error);
        setUser(null);
      } finally {
        console.log('[AuthProvider] loadUserFromServer finished. Setting loading to false.');
        setLoading(false);
      }
    }

    if (!pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
      // Prevent running for Next.js internal routes
      loadUserFromServer();
    } else {
      console.log('[AuthProvider] Skipping loadUserFromServer for Next.js internal route:', pathname);
      setLoading(false); // Still need to set loading false for these paths
    }
  }, [pathname, router, BACKEND_URL, sessionCheckTrigger, setUser]); // Added setUser to dependencies, good practice.

  const signOut = async () => {
    // ... (signOut logic remains the same) ...
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      setUser(null);
      clearSidebarCache();
      router.push('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  console.log(
    '[AuthProvider] Rendering. User:',
    user,
    'Loading:',
    loading,
    'Pathname:',
    pathname,
    'Trigger:',
    sessionCheckTrigger
  );

  return (
    <AuthContext.Provider value={{ user, loading, setUserStateOnly, signOut, triggerSessionCheck }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
