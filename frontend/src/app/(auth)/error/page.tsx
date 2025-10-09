// frontend/src/app/(auth)/error/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { Box, Typography, Alert, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams?.get('message') || 'Ha ocurrido un error inesperado durante la autenticación';

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

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Cargando...</Typography>
      </Box>
    }>
      <ErrorContent />
    </Suspense>
  );
}

// Evitar prerenderizado estático
export const dynamic = 'force-dynamic';