'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { Box, CircularProgress } from '@mui/material';
import { UserRole } from '@/types/auth.types';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.rol) {
      // ROLES CON NUEVA CARPETA
      const dashboardPath = {
        [UserRole.SOLICITANTE]: '/solicitante',
        [UserRole.OPERADOR]: '/operador'
      }[session.user.rol];

      if (dashboardPath) {
        router.push(dashboardPath);
      }
    }
  }, [status, session, router]);

  
  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // AUTENTICADO REDIRIGE
  if (status === 'authenticated') {
    return null;
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <LoginForm />
    </Box>
  );
}