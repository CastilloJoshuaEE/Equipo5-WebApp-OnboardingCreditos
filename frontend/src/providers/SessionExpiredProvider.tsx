'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import SesionExpiradaModal from '@/components/ui/SesionExpiradaModal';
import { sessionEmitter } from '@/lib/axios';

interface SessionExpiredContextProps {
  showSessionExpired: () => void;
}

const SessionExpiredContext = createContext<SessionExpiredContextProps>({
  showSessionExpired: () => {},
});

export const useSessionExpired = () => useContext(SessionExpiredContext);

export const SessionExpiredProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);

  const showSessionExpired = () => setOpen(true);

  useEffect(() => {
    const handler = () => showSessionExpired();
    sessionEmitter.on('expired', handler);
    return () => sessionEmitter.off('expired', handler);
  }, []);

  return (
    <SessionExpiredContext.Provider value={{ showSessionExpired }}>
      {children}
      <SesionExpiradaModal open={open} />
    </SessionExpiredContext.Provider>
  );
};
