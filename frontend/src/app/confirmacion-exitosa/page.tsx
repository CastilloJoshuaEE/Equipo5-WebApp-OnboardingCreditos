'use client';

import { Box, Typography, Button, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function ConfirmacionExitosa() {
  const router = useRouter();

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" gap={3} p={3}>
      <Alert severity="success" sx={{ width: '100%', maxWidth: 500 }}>
        <Typography variant="h6" gutterBottom>
          ✅ Email Confirmado Exitosamente
        </Typography>
        <Typography>
          Tu dirección de email ha sido confirmada correctamente. Ahora puedes iniciar sesión en el sistema.
        </Typography>
      </Alert>

      <Box display="flex" gap={2}>
        <Button 
          variant="contained" 
          onClick={() => router.push('/login')}
        >
          Ir al Login
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/')}
        >
          Volver al Inicio
        </Button>
      </Box>
    </Box>
  );
}