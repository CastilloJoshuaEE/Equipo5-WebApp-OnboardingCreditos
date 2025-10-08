'use client';

import { useSearchParams } from 'next/navigation';
import { Box, Typography, Alert, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams?.get('message') || 'Ha ocurrido un error inesperado';

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" gap={3} p={3}>
      <Alert severity="error" sx={{ width: '100%', maxWidth: 500 }}>
        <Typography variant="h6" gutterBottom>
          Error de Autenticación
        </Typography>
        <Typography>
          {message}
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