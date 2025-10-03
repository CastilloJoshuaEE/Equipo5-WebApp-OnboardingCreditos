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

  // Redirección si el usuario ya está autenticado (protección del lado del cliente)
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.rol) {
      const role = session.user.rol as UserRole;
      const path = role === UserRole.SOLICITANTE ? '/solicitante/dashboard' : '/operador/dashboard';
      router.push(path);
    }
  }, [status, session, router]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', py: 4 }}>
      <LoginForm />
    </Box>
  );
}