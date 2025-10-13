'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';

function RestablecerCuentaContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token');
  const email = searchParams?.get('email');

  useEffect(() => {
    const procesarRecuperacion = async () => {
      if (!token || !email) {
        setStatus('error');
        setMessage('Token o email no proporcionados');
        return;
      }

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(
          `${API_URL}/auth/restablecer-cuenta?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        // Como es una redirección, manejamos el resultado de forma diferente
        if (response.redirected) {
          const url = new URL(response.url);
          const messageParam = url.searchParams.get('message');
          const errorParam = url.searchParams.get('error');
          
          if (errorParam) {
            setStatus('error');
            setMessage(getErrorMessage(errorParam));
          } else if (messageParam) {
            setStatus('success');
            setMessage(getSuccessMessage(messageParam));
            
            setTimeout(() => {
              router.push('/login');
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Error procesando recuperación:', error);
        setStatus('error');
        setMessage('Error de conexión al procesar la recuperación');
      }
    };

    procesarRecuperacion();
  }, [token, email, router]);

  const getErrorMessage = (error: string) => {
    const errors: { [key: string]: string } = {
      'token_invalido': 'El enlace de recuperación no es válido',
      'token_expirado': 'El enlace de recuperación ha expirado',
      'usuario_no_encontrado': 'No se encontró una cuenta con este email',
      'recuperacion_fallida': 'Error al procesar la recuperación'
    };
    return errors[error] || 'Error desconocido';
  };

  const getSuccessMessage = (message: string) => {
    const messages: { [key: string]: string } = {
      'cuenta_reactivada': '¡Cuenta reactivada exitosamente! Ya puedes iniciar sesión.'
    };
    return messages[message] || 'Operación completada';
  };

  if (status === 'loading') {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" gap={3}>
        <CircularProgress size={60} />
        <Typography variant="h5" textAlign="center">
          Procesando recuperación de cuenta...
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
          {status === 'success' ? '. Recuperación Exitosa' : '. Error de Recuperación'}
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

export default function RestablecerCuentaPage() {
  return (
    <Suspense fallback={
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" gap={3}>
        <CircularProgress size={60} />
        <Typography variant="h5" textAlign="center">
          Cargando...
        </Typography>
      </Box>
    }>
      <RestablecerCuentaContent />
    </Suspense>
  );
}