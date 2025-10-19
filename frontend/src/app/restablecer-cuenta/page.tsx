'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress, Alert, Button, TextField } from '@mui/material';

function RestablecerCuentaContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [cambiandoContrasena, setCambiandoContrasena] = useState(false);
  const [tokenValido, setTokenValido] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams?.get('token');
  const email = searchParams?.get('email');

  useEffect(() => {
    const verificarToken = async () => {
      if (!token || !email) {
        setStatus('error');
        setMessage('Enlace inválido. Faltan parámetros requeridos.');
        return;
      }

      try {
        // Primero verificamos si el token es válido llamando al backend
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

        if (response.ok) {
          setStatus('success');
          setTokenValido(true);
          setMessage('Token válido. Puedes establecer una nueva contraseña.');
        } else {
          const errorData = await response.json();
          setStatus('error');
          setMessage(errorData.message || 'Token inválido o expirado');
        }
      } catch (error) {
        console.error('Error verificando token:', error);
        setStatus('error');
        setMessage('Error de conexión al verificar el enlace');
      }
    };

    verificarToken();
  }, [token, email]);

  const handleCambiarContrasena = async () => {
    if (!nuevaContrasena || !confirmarContrasena) {
      setMessage('Por favor completa ambos campos de contraseña');
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setMessage('Las contraseñas no coinciden');
      return;
    }

    if (nuevaContrasena.length < 6) {
      setMessage('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setCambiandoContrasena(true);
    setMessage('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${API_URL}/usuarios/recuperar-contrasena`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: decodeURIComponent(email || ''),
          nueva_contrasena: nuevaContrasena,
          confirmar_contrasena: confirmarContrasena
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('¡Contraseña actualizada exitosamente! Redirigiendo al login...');
        setTimeout(() => {
          router.push('/login?message=contrasena_actualizada');
        }, 3000);
      } else {
        setMessage(data.message || 'Error al actualizar la contraseña');
      }
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      setMessage('Error de conexión al cambiar la contraseña');
    } finally {
      setCambiandoContrasena(false);
    }
  };

  if (status === 'loading') {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" gap={3}>
        <CircularProgress size={60} />
        <Typography variant="h5" textAlign="center">
          Verificando enlace de recuperación...
        </Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" gap={3} p={3}>
      <Typography variant="h4" component="h1" textAlign="center" gutterBottom>
        Restablecer Contraseña
      </Typography>

      {message && (
        <Alert 
          severity={message.includes('éxito') ? 'success' : message.includes('válido') ? 'info' : 'error'}
          sx={{ width: '100%', maxWidth: 500 }}
        >
          {message}
        </Alert>
      )}

      {tokenValido && status === 'success' && (
        <Box component="form" sx={{ width: '100%', maxWidth: 500 }} gap={2} display="flex" flexDirection="column">
          <TextField
            label="Nueva Contraseña"
            type="password"
            value={nuevaContrasena}
            onChange={(e) => setNuevaContrasena(e.target.value)}
            fullWidth
            margin="normal"
            disabled={cambiandoContrasena}
            placeholder="Mínimo 8 caracteres"
          />
          
          <TextField
            label="Confirmar Contraseña"
            type="password"
            value={confirmarContrasena}
            onChange={(e) => setConfirmarContrasena(e.target.value)}
            fullWidth
            margin="normal"
            disabled={cambiandoContrasena}
            placeholder="Repite la contraseña"
          />
          
          <Button
            variant="contained"
            onClick={handleCambiarContrasena}
            disabled={cambiandoContrasena || !nuevaContrasena || !confirmarContrasena}
            size="large"
            sx={{ mt: 2 }}
          >
            {cambiandoContrasena ? 'Cambiando Contraseña...' : 'Establecer Nueva Contraseña'}
          </Button>
        </Box>
      )}

      <Box display="flex" gap={2} mt={2}>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/login')}
        >
          Volver al Login
        </Button>
        <Button 
          variant="text" 
          onClick={() => router.push('/')}
        >
          Ir al Inicio
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