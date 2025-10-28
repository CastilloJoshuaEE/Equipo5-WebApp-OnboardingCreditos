// frontend/src/providers/SessionExpiredProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import SesionExpiradaModal from '@/components/ui/SesionExpiradaModal';
import { sessionEmitter } from '@/lib/axios';
import { usePathname } from 'next/navigation';

interface SessionExpiredContextProps {
  showSessionExpired: () => void;
}

const SessionExpiredContext = createContext<SessionExpiredContextProps>({
  showSessionExpired: () => {},
});

export const useSessionExpired = () => useContext(SessionExpiredContext);

export const SessionExpiredProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const showSessionExpired = () => {
    // No mostrar en páginas de auth
    if (pathname?.includes('/login') || pathname?.includes('/register')) {
      return;
    }
    setOpen(true);
  };

  useEffect(() => {
    const handler = () => showSessionExpired();
    
    sessionEmitter.on('expired', handler);
    sessionEmitter.on('unauthorized', handler);
    
    return () => {
      sessionEmitter.off('expired', handler);
      sessionEmitter.off('unauthorized', handler);
    };
  }, [pathname]);

  return (
    <SessionExpiredContext.Provider value={{ showSessionExpired }}>
      {children}
      <SesionExpiradaModal open={open} />
    </SessionExpiredContext.Provider>
  );
};