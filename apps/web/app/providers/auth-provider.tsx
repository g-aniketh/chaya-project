'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    async function loadUserFromServer() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Data from server of user: ', data);
          setUser(data.user);
        } else {
          console.error('Failed to fetch user: ', response.statusText);
          if (response.status === 401) {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserFromServer();
  }, [router]);

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
