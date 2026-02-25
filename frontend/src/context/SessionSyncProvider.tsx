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
      console.log(' SessionSync - Sesión actualizada:', currentSession?.user?.name);
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
      console.log(' SessionSync - Sincronizando con NextAuth session');
      setSession(nextAuthSession);
      setIsLoading(false);
    } else if (status === 'unauthenticated') {
      console.log('SessionSync - Sesión no autenticada');
      setSession(null);
      setIsLoading(false);
    }
  }, [nextAuthSession, status]);

  // Escuchar eventos de login/logout
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.includes('next-auth') || event.key?.includes('session')) {
        console.log('📦 SessionSync - Cambio en storage detectado');
        refreshSession();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log(' SessionSync - Página visible, verificando sesión...');
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