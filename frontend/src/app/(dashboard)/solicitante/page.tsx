'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { signOut, useSession } from 'next-auth/react';

// Página de prueba para verificar el flujo de rol 'solicitante'
export default function SolicitanteDashboardPage() {
  const { data: session } = useSession();

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
