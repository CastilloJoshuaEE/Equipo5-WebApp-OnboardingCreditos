'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import RegisterForm from '@/components/auth/RegisterForm';
import { Box, CircularProgress } from '@mui/material';
import { UserRole } from '@/types/auth.types';


export default function RegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.rol) {
      // REDIRIGE NUEVAS CARPETAS
      const dashboardPath = {
        [UserRole.SOLICITANTE]: '/dashboard/solicitante',
        [UserRole.OPERADOR]: '/dashboard/operador'
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

  if (status === 'authenticated') {
    return null;
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <RegisterForm />
    </Box>
  );
}