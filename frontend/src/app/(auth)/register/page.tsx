'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import RegisterForm from '@/components/auth/RegisterForm';
import { Box, CircularProgress, Grid } from '@mui/material';
import Image from 'next/image';
import { UserRole } from '@/types/auth.types';

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.rol) {
      const dashboardPath = {
        [UserRole.SOLICITANTE]: '/solicitante',
        [UserRole.OPERADOR]: '/operador',
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
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      minHeight="95vh"
      sx={{
        bgcolor: '#fafafa',
        px: { xs: 2, md: 4 },
        gap: { xs: 3, md: 6 },
      }}
    >
      {/* Columna izquierda: formulario */}
      <Grid item xs={12} md={7}>
        <RegisterForm />
      </Grid>

      {/* Columna derecha: imagen informativa */}
      <Grid
        item
        md={4}
        sx={{
          display: { xs: 'none', md: 'flex' },
          bgcolor: '#F3CDFB',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          borderRadius: 3,
          boxShadow: 2,
          height: '95vh',
        }}
      >
        <Box textAlign="center" p={3}>
          <Image
            src=""
            alt="Registro ilustración"
            width={350}
            height={350}
            style={{ objectFit: 'contain', marginBottom: '1rem' }}
          />
        </Box>
      </Grid>
    </Grid>
  );
}
