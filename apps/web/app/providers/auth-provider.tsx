'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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
  setUser: (user: User) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    async function loadUserFromServer() {
      setLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('AuthProvider: User loaded from /me:', data.user);
          setUser(data.user);
          if (pathname === '/login') {
            console.log('AuthProvider: On login page with user, redirecting to /dashboard');
            router.push('/dashboard');
          }
        } else {
          console.error('AuthProvider: Failed to fetch user from /me, status:', response.statusText);
          setUser(null);
          if (response.status === 401 && !pathname.startsWith('/login')) {
            console.log('AuthProvider: Not authenticated and not on login, redirecting to /login');
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
    if (!pathname.startsWith('/_next') && !pathname.startsWith('/api/')) {
      loadUserFromServer();
    } else {
      setLoading(false);
    }
  }, [pathname, router, BACKEND_URL]);

  const signOut = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      setUser(null);

      clearSidebarCache();

      router.push('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return <AuthContext.Provider value={{ user, loading, setUser, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
