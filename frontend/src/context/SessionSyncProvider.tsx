// frontend/src/context/SessionSyncProvider.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { getSession, useSession } from 'next-auth/react';
import { Session } from 'next-auth';
interface SessionSyncContextType {
  session: Session | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
}

const SessionSyncContext = createContext<SessionSyncContextType | undefined>(undefined);

export function SessionSyncProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: nextAuthSession, status } = useSession();

  const refreshSession = async () => {
    setIsLoading(true);
    try {
      const currentSession = await getSession();
      setSession(currentSession);
    } catch (error) {
      console.error('Error refrescando sesión:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  // Sincronizar con NextAuth session
  useEffect(() => {
    if (status === 'authenticated') {
      setSession(nextAuthSession);
      setIsLoading(false);
    } else if (status === 'unauthenticated') {
      setSession(null);
      setIsLoading(false);
    }
  }, [nextAuthSession, status]);

  // Escuchar eventos de login/logout
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.includes('next-auth') || event.key?.includes('session')) {
        refreshSession();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <SessionSyncContext.Provider value={{ session, isLoading, refreshSession }}>
      {children}
    </SessionSyncContext.Provider>
  );
}

export const useSessionSync = () => {
  const context = useContext(SessionSyncContext);
  if (context === undefined) {
    throw new Error('useSessionSync must be used within a SessionSyncProvider');
  }
  return context;
};