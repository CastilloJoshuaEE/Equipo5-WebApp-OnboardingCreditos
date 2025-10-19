'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import RegisterForm from '@/components/auth/RegisterForm';
import { Box, CircularProgress, Grid, Container } from '@mui/material';
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
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Grid container spacing={4} justifyContent="center" alignItems="stretch">
       
        <Grid item xs={12}>
          <Box
            sx={{
              bgcolor: 'background.paper',
              p: { xs: 2, md: 4 },
              borderRadius: 2,
              boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
            }}
          >
            <RegisterForm />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
