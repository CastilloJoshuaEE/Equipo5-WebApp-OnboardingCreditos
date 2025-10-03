'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { signOut, useSession } from 'next-auth/react';

// Página de prueba para verificar el flujo de rol 'operador'
export default function OperadorDashboardPage() {
  const { data: session } = useSession();

  return (
    <Box sx={{ p: 4, bgcolor: '#f0f4f8' }}>
      <Typography variant="h3" component="h1" gutterBottom color="secondary">
        Dashboard Operador
      </Typography>
      <Typography variant="h6">
        Bienvenido, {session?.user?.name || 'Usuario'} (Rol: {session?.user?.rol || 'No Definido'}).
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Esta página es visible solo para el rol operador.
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
