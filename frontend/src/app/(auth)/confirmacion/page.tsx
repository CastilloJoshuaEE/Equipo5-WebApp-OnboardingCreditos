'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';

function ConfirmacionContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token');

  useEffect(() => {
    const confirmEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token no proporcionado');
        return;
      }

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${API_URL}/auth/confirmar?token=${encodeURIComponent(token)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setStatus('success');
          setMessage('¡Email confirmado exitosamente! Ya puedes iniciar sesión.');
          
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          const errorData = await response.json();
          setStatus('error');
          setMessage(errorData.message || 'Error al confirmar el email');
        }
      } catch (error) {
        console.error('Error confirmando email:', error);
        setStatus('error');
        setMessage('Error de conexión al confirmar el email');
      }
    };

    confirmEmail();
  }, [token, router]);

  if (status === 'loading') {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" gap={3}>
        <CircularProgress size={60} />
        <Typography variant="h5" textAlign="center">
          Confirmando tu email...
        </Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" gap={3} p={3}>
      <Alert 
        severity={status === 'success' ? 'success' : 'error'}
        sx={{ width: '100%', maxWidth: 500 }}
      >
        <Typography variant="h6" gutterBottom>
          {status === 'success' ? '✅ Confirmación Exitosa' : '❌ Error de Confirmación'}
        </Typography>
        <Typography>
          {message}
        </Typography>
      </Alert>

      <Box display="flex" gap={2} mt={2}>
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

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" gap={3}>
        <CircularProgress size={60} />
        <Typography variant="h5" textAlign="center">
          Cargando...
        </Typography>
      </Box>
    }>
      <ConfirmacionContent />
    </Suspense>
  );
}