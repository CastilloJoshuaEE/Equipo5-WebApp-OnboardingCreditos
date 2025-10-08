'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { UserRole } from '@/types/auth.types';

export default function DashboardSolicitante() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
 
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    if (session?.user?.rol !== UserRole.SOLICITANTE) {
      router.push('/dashboard/operador');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom color="primary">
        Dashboard Solicitante PYME
      </Typography>
      <Typography variant="h6">
        Bienvenido, {session?.user?.name || 'Usuario'} (Rol: {session?.user?.rol || 'No Definido'}).
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Esta página es visible solo para el rol solicitante.
      </Typography>
      <Button 
          variant="outlined" 
          color="error" 
          sx={{ mt: 3 }}
          onClick={() => signOut({ callbackUrl: '/login' })}
      >
        Cerrar Sesión
      </Button>
    </Box>
  );
}
