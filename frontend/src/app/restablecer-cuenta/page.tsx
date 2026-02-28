// frontend/src/app/restablecer-cuenta/page.tsx

'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  TextField,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

function RestablecerCuentaContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'reactivada'>('loading');
  const [message, setMessage] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [showNuevaContrasena, setShowNuevaContrasena] = useState(false);
  const [showConfirmarContrasena, setShowConfirmarContrasena] = useState(false);
  const [cambiandoContrasena, setCambiandoContrasena] = useState(false);
  const [tokenValido, setTokenValido] = useState(false);
  const [cuentaYaActiva, setCuentaYaActiva] = useState(false);

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
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        // Usar fetch normal, no seguir redirecciones automáticamente
        const response = await fetch(
          `${API_URL}/reactivacion/procesar?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
          { 
            method: 'GET', 
            headers: { 'Content-Type': 'application/json' },
            redirect: 'manual' // No seguir redirecciones automáticamente
          }
        );

        // Intentar parsear como JSON
        const data = await response.json();

        if (data.success) {
          if (data.cuenta_activa) {
            setStatus('reactivada');
            setCuentaYaActiva(true);
            setMessage('Tu cuenta ya está activa. Puedes iniciar sesión.');
          } else if (data.cuenta_reactivada) {
            setStatus('reactivada');
            setMessage('¡Cuenta reactivada exitosamente! Redirigiendo al login...');
            setTimeout(() => {
              router.push('/login?message=cuenta_reactivada');
            }, 3000);
          } else {
            setStatus('success');
            setTokenValido(true);
            setMessage('Token válido. Puedes establecer una nueva contraseña.');
          }
        } else {
          setStatus('error');
          setMessage(data.message || 'Token inválido o expirado');
        }
      } catch (error) {
        console.error('Error verificando token:', error);
        setStatus('error');
        setMessage('Error de conexión al verificar el enlace');
      }
    };

    verificarToken();
  }, [token, email, router]);

  const handleCambiarContrasena = async () => {
    if (!nuevaContrasena || !confirmarContrasena) {
      setMessage('Por favor completa ambos campos de contraseña');
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setMessage('Las contraseñas no coinciden');
      return;
    }

    if (nuevaContrasena.length < 8) {
      setMessage('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setCambiandoContrasena(true);
    setMessage('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${API_URL}/usuarios/recuperar-contrasena`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        {cuentaYaActiva ? 'Cuenta Activa' : 'Restablecer Contraseña'}
      </Typography>

      {message && (
        <Alert
          severity={
            message.includes('éxito') ? 'success' : 
            message.includes('activa') ? 'info' : 
            message.includes('válido') ? 'info' : 'error'
          }
          sx={{ width: '100%', maxWidth: 500 }}
        >
          {message}
        </Alert>
      )}

      {cuentaYaActiva && (
        <Box sx={{ width: '100%', maxWidth: 500, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => router.push('/login')}
            size="large"
            sx={{ mt: 2 }}
          >
            Ir a Iniciar Sesión
          </Button>
        </Box>
      )}

      {tokenValido && status === 'success' && !cuentaYaActiva && (
        <Box component="form" sx={{ width: '100%', maxWidth: 500 }} gap={2} display="flex" flexDirection="column">
          <TextField
            label="Nueva Contraseña"
            type={showNuevaContrasena ? 'text' : 'password'}
            value={nuevaContrasena}
            onChange={(e) => setNuevaContrasena(e.target.value)}
            fullWidth
            margin="normal"
            disabled={cambiandoContrasena}
            placeholder="Mínimo 8 caracteres"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNuevaContrasena(!showNuevaContrasena)}
                    edge="end"
                  >
                    {showNuevaContrasena ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Confirmar Contraseña"
            type={showConfirmarContrasena ? 'text' : 'password'}
            value={confirmarContrasena}
            onChange={(e) => setConfirmarContrasena(e.target.value)}
            fullWidth
            margin="normal"
            disabled={cambiandoContrasena}
            placeholder="Repite la contraseña"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmarContrasena(!showConfirmarContrasena)}
                    edge="end"
                  >
                    {showConfirmarContrasena ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
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
        <Button variant="text" onClick={() => router.push('/')}>
          Ir al Home
        </Button>
      </Box>
    </Box>
  );
}

export default function RestablecerCuentaPage() {
  return (
    <Suspense
      fallback={
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" gap={3}>
          <CircularProgress size={60} />
          <Typography variant="h5" textAlign="center">
            Cargando...
          </Typography>
        </Box>
      }
    >
      <RestablecerCuentaContent />
    </Suspense>
  );
}