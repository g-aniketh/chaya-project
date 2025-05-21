'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react'; // Added useCallback
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
  setUserStateOnly: (user: User | null) => void; // Renamed for clarity, only sets state
  signOut: () => Promise<void>;
  triggerSessionCheck: () => void; // New function to re-run /me
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUserStateOnly: () => {},
  signOut: async () => {},
  triggerSessionCheck: () => {}, // New default
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionCheckTrigger, setSessionCheckTrigger] = useState(0); // State to trigger effect
  const router = useRouter();
  const pathname = usePathname();

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

  const triggerSessionCheck = useCallback(() => {
    console.log('AuthProvider: triggerSessionCheck called');
    setSessionCheckTrigger(prev => prev + 1);
  }, []);

  // Renamed from setUser to setUserStateOnly to avoid confusion with the action of logging in.
  // This function is for direct state manipulation if absolutely needed from elsewhere,
  // but primary user state should come from loadUserFromServer.
  const setUserStateOnly = useCallback((newUser: User | null) => {
    setUser(newUser);
  }, []);

  useEffect(() => {
    async function loadUserFromServer() {
      console.log('AuthProvider: loadUserFromServer running due to pathname or trigger change.');
      setLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('AuthProvider: User loaded from /me:', data.user);
          setUser(data.user);
          // If we successfully got a user AND we are currently on the login page, redirect.
          if (data.user && pathname === '/login') {
            console.log('AuthProvider: User exists and on login page, redirecting to /dashboard');
            router.push('/dashboard');
          }
        } else {
          console.log('AuthProvider: Failed to fetch user from /me. Status:', response.status);
          setUser(null);
          // If /me fails (e.g. 401) and we're NOT on the login page already, push to login.
          // The middleware should catch direct access, this handles client-side session expiry/nav.
          if (!pathname.startsWith('/login') && response.status === 401) {
            console.log('AuthProvider: /me failed (401) and not on login page, redirecting to /login.');
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('AuthProvider: Error fetching user from /me:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    // Only run if not on a _next or api path, and ensure trigger works.
    if (!pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
      loadUserFromServer();
    } else {
      setLoading(false); // For static assets, don't keep loading status
    }
    // Add sessionCheckTrigger to dependencies
  }, [pathname, router, BACKEND_URL, sessionCheckTrigger]);

  const signOut = async () => {
    // ... (signOut logic remains the same)
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      setUser(null);
      clearSidebarCache();
      router.push('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUserStateOnly, signOut, triggerSessionCheck }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
