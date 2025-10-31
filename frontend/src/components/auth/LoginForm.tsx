'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  InputAdornment,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { loginSchema } from '@/schemas/auth.schema';
import type { LoginInput } from '@/types/auth.types';

export default function LoginForm() {
  const [error, setError] = useState('');
    const [redirectMessage, setRedirectMessage] = useState(''); // 🔹 Mensaje del overlay

  const [redirecting, setRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recuperarOpen, setRecuperarOpen] = useState(false);
  const [recuperarContrasenaOpen, setRecuperarContrasenaOpen] = useState(false);
  const [emailRecuperacion, setEmailRecuperacion] = useState('');
  const [recuperarLoading, setRecuperarLoading] = useState(false);
  const [recuperarMessage, setRecuperarMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recuperarContrasenaData, setRecuperarContrasenaData] = useState({
    email: '',
    nueva_contrasena: '',
    confirmar_contrasena: ''
  });
  const [showNuevaContrasena, setShowNuevaContrasena] = useState(false);
  const [showConfirmarContrasena, setShowConfirmarContrasena] = useState(false);
  const router = useRouter();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  });

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowNuevaContrasena = () => {
    setShowNuevaContrasena(!showNuevaContrasena);
  };

  const handleClickShowConfirmarContrasena = () => {
    setShowConfirmarContrasena(!showConfirmarContrasena);
  };
  const handleRedirectWithOverlay = (path: string, message: string) => {
    setRedirectMessage(message);
    setRedirecting(true);
    setTimeout(() => {
      router.push(path);
    }, 1200);
  };

  const onSubmit: SubmitHandler<LoginInput> = async (data) => {
    try {
      setIsLoading(true);
      setError('');

      console.log('Enviando credenciales:', data.email);

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      console.log('Resultado del signIn:', result);

      if (result?.error) {
        console.error('Error en signIn:', result.error);

        // Mostrar alerta si el backend devolvió mensajes específicos
        if (result.error.includes('bloqueada')) {
          alert(`. ${result.error}`);
        } else if (result.error.includes('intentos')) {
          alert(`. ${result.error}`);
        } else {
          alert('. Credenciales inválidas. Por favor verifica tu email y contraseña.');
        }

        setError(result.error);
        return;
      }

      // Login exitoso - obtener información del usuario para determinar el rol
      console.log('Login exitoso, obteniendo información del usuario...');
      
      // Obtener la sesión actualizada
      const sessionResponse = await fetch('/api/auth/session');
      const session = await sessionResponse.json();
      
      console.log('Sesión obtenida:', session);

      if (session?.user?.rol) {
        // Redirigir según el rol del usuario
        const userRole = session.user.rol.toLowerCase();
        
        switch (userRole) {
          case 'solicitante':
            router.push('/solicitante');
            break;
          case 'operador':
            router.push('/operador');
            break;
          default:
            router.push('/');
            break;
        }
      } else {
        // Si no se puede determinar el rol, redirigir al home
        console.warn('No se pudo determinar el rol del usuario, redirigiendo al home');
        router.push('/');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      setError('Error al iniciar sesión. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para recuperar cuenta inactiva
  const handleRecuperarCuenta = async () => {
    if (!emailRecuperacion) {
      setRecuperarMessage('Por favor ingresa tu email');
      return;
    }

    try {
      setRecuperarLoading(true);
      setRecuperarMessage('');

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/usuario/solicitar-reactivacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: emailRecuperacion
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRecuperarMessage('Se ha enviado un enlace de reactivación a tu email. Por favor revisa tu bandeja de entrada.');
        setEmailRecuperacion('');
        setTimeout(() => setRecuperarOpen(false), 3000);
      } else {
        setRecuperarMessage(data.message || 'Error al solicitar reactivación');
      }
    } catch (error) {
      console.error('Error recuperando cuenta:', error);
      setRecuperarMessage('Error de conexión al solicitar reactivación');
    } finally {
      setRecuperarLoading(false);
    }
  };

  // Función para recuperar contraseña
  const handleRecuperarContrasena = async () => {
    const { email, nueva_contrasena, confirmar_contrasena } = recuperarContrasenaData;

    if (!email || !nueva_contrasena || !confirmar_contrasena) {
      setRecuperarMessage('Por favor completa todos los campos');
      return;
    }

    if (nueva_contrasena !== confirmar_contrasena) {
      setRecuperarMessage('Las contraseñas no coinciden');
      return;
    }

    if (nueva_contrasena.length < 6) {
      setRecuperarMessage('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      setRecuperarLoading(true);
      setRecuperarMessage('');

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/usuarios/recuperar-contrasena`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          nueva_contrasena,
          confirmar_contrasena
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRecuperarMessage('Contraseña actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.');
        setRecuperarContrasenaData({
          email: '',
          nueva_contrasena: '',
          confirmar_contrasena: ''
        });
        setTimeout(() => {
          setRecuperarContrasenaOpen(false);
          setRecuperarMessage('');
        }, 3000);
      } else {
        setRecuperarMessage(data.message || 'Error al recuperar la contraseña');
      }
    } catch (error) {
      console.error('Error recuperando contraseña:', error);
      setRecuperarMessage('Error de conexión al recuperar contraseña');
    } finally {
      setRecuperarLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop overlay que cubre la pantalla mientras isLoading = true */}
      <Backdrop
        open={isLoading || redirecting}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1200,
          color: '#fff',
          flexDirection: 'column',
          display: 'flex',
          gap: 2,
        }}
      >
        <CircularProgress />
    <Typography variant="body1">
          {redirecting ? redirectMessage : 'Iniciando sesión...'}
        </Typography>
              </Backdrop>

      <Box
        sx={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0px 4px 20px 0px #0000001A',
          py: 2,
          px: { xs: 2, md: 4 },
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 2,
        }}
        component="form"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: '1.25rem',
            fontWeight: 600,
            textAlign: 'center',
            mb: 1,
            color: '#213126',
          }}
        >
          Iniciar sesión
        </Typography>

        <Typography
          variant="h3"
          sx={{
            fontSize: '1rem',
            textAlign: 'center',
            color: '#9ba39c',
            mb: 2,
          }}
        >
          Ingresa tus credenciales para acceder a tu cuenta
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2, 
              width: '100%',
              '& .MuiAlert-message': {
                fontSize: '0.875rem'
              }
            }}
          >
            {error}
          </Alert>
        )}

        <TextField
          {...register('email')}
          label="Email"
          placeholder="Email"
          type="email"
          fullWidth
          margin="normal"
          error={!!errors.email}
          helperText={errors.email?.message}
          disabled={isLoading}
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
        />

        <TextField
          {...register('password')}
          label="Contraseña"
          placeholder="Password"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          margin="normal"
          error={!!errors.password}
          helperText={errors.password?.message}
          disabled={isLoading}
          sx={{ 
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  edge="end"
                  sx={{ color: '#68756b' }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading}
          sx={{
            backgroundColor: '#CDB9D8',
            color: '#68756b',
            fontSize: '1rem',
            letterSpacing: '0.46px',
            textTransform: 'uppercase',
            mb: 2,
            py: 1.5,
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: '#bca4c7',
            },
            '&:disabled': {
              backgroundColor: '#e0e0e0',
              color: '#9e9e9e'
            }
          }}
        >
          {isLoading ? 'Iniciando sesión...' : 'Inicia sesión'}
        </Button>

     <Stack direction="column" spacing={1} sx={{ mt: 2, width: '100%' }}>
          <Typography sx={{ textAlign: 'center', fontSize: '0.875rem' }}>
            ¿No tenés cuenta?{' '}
            <Box
              component="span"
              sx={{
                color: '#DA68F2',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={() => handleRedirectWithOverlay('/register', 'Redirigiendo al registro...')}
            >
              Registrate aquí
            </Box>
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="text"
              color="secondary"
              onClick={() => setRecuperarContrasenaOpen(true)}
              disabled={isLoading}
              size="small"
              sx={{ fontSize: '0.75rem', color: '#DA68F2' }}
            >
              ¿Olvidaste tu contraseña?
            </Button>
            
            <Button
              variant="text"
              color="warning"
              onClick={() => setRecuperarOpen(true)}
              disabled={isLoading}
              size="small"
              sx={{ fontSize: '0.75rem', color: '#ff9800' }}
            >
              Recuperar cuenta
            </Button>
          </Box>
        </Stack>
      </Box>

      {/* Modal de Recuperar Contraseña */}
      <Dialog open={recuperarContrasenaOpen} onClose={() => setRecuperarContrasenaOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="div">
            Recuperar Contraseña
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ingresa tu email y establece una nueva contraseña para tu cuenta.
          </Typography>
          
          {recuperarMessage && (
            <Alert severity={recuperarMessage.includes('exitosamente') ? 'success' : 'error'} sx={{ mb: 2 }}>
              {recuperarMessage}
            </Alert>
          )}

          <Stack spacing={2}>
            <TextField
              label="Email de la cuenta"
              type="email"
              fullWidth
              value={recuperarContrasenaData.email}
              onChange={(e) => setRecuperarContrasenaData(prev => ({
                ...prev,
                email: e.target.value
              }))}
              margin="normal"
              placeholder="ejemplo@email.com"
            />

            <TextField
              label="Nueva Contraseña"
              type={showNuevaContrasena ? 'text' : 'password'}
              fullWidth
              value={recuperarContrasenaData.nueva_contrasena}
              onChange={(e) => setRecuperarContrasenaData(prev => ({
                ...prev,
                nueva_contrasena: e.target.value
              }))}
              margin="normal"
              helperText="Mínimo 8 caracteres"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowNuevaContrasena}
                      edge="end"
                      sx={{ color: '#68756b' }}
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
              fullWidth
              value={recuperarContrasenaData.confirmar_contrasena}
              onChange={(e) => setRecuperarContrasenaData(prev => ({
                ...prev,
                confirmar_contrasena: e.target.value
              }))}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowConfirmarContrasena}
                      edge="end"
                      sx={{ color: '#68756b' }}
                    >
                      {showConfirmarContrasena ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRecuperarContrasenaOpen(false);
            setRecuperarMessage('');
          }} disabled={recuperarLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleRecuperarContrasena} 
            variant="contained"
            disabled={recuperarLoading || !recuperarContrasenaData.email || !recuperarContrasenaData.nueva_contrasena || !recuperarContrasenaData.confirmar_contrasena}
          >
            {recuperarLoading ? 'Procesando...' : 'Restablecer Contraseña'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Recuperar Cuenta Inactiva */}
      <Dialog open={recuperarOpen} onClose={() => setRecuperarOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="div">
            Recuperar Cuenta Inactiva
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Si tu cuenta está desactivada, ingresa tu email para recibir un enlace de reactivación.
          </Typography>
          
          {recuperarMessage && (
            <Alert severity={recuperarMessage.includes('enviado') ? 'success' : 'error'} sx={{ mb: 2 }}>
              {recuperarMessage}
            </Alert>
          )} 

          <TextField
            label="Email de la cuenta"
            type="email"
            fullWidth
            value={emailRecuperacion}
            onChange={(e) => setEmailRecuperacion(e.target.value)}
            margin="normal"
            placeholder="ejemplo@email.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecuperarOpen(false)} disabled={recuperarLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleRecuperarCuenta} 
            variant="contained"
            disabled={recuperarLoading || !emailRecuperacion}
          >
            {recuperarLoading ? 'Enviando...' : 'Solicitar Reactivación'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
