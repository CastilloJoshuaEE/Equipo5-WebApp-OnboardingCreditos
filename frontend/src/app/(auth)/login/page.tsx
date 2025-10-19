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
  Stack
} from '@mui/material';
import { loginSchema } from '@/schemas/auth.schema';
import type { LoginInput } from '@/types/auth.types';

export default function LoginForm() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recuperarOpen, setRecuperarOpen] = useState(false);
  const [recuperarContrasenaOpen, setRecuperarContrasenaOpen] = useState(false);
  const [emailRecuperacion, setEmailRecuperacion] = useState('');
  const [recuperarLoading, setRecuperarLoading] = useState(false);
  const [recuperarMessage, setRecuperarMessage] = useState('');
  const [recuperarContrasenaData, setRecuperarContrasenaData] = useState({
    email: '',
    nueva_contrasena: '',
    confirmar_contrasena: ''
  });
  const router = useRouter();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  });

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
        setError('Credenciales inválidas. Por favor verifica tu email y contraseña.');
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
      <Box component="form" onSubmit={handleSubmit(onSubmit)} width="100%" maxWidth={400} p={3}>
        <Typography variant="h4" component="h1" textAlign="center" gutterBottom>
          Iniciar Sesión
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          {...register('email')}
          label="Correo electrónico"
          type="email"
          fullWidth
          margin="normal"
          error={!!errors.email}
          helperText={errors.email?.message}
          disabled={isLoading}
        />

        <TextField
          {...register('password')}
          type="password"
          label="Contraseña"
          fullWidth
          margin="normal"
          error={!!errors.password}
          helperText={errors.password?.message}
          disabled={isLoading}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={isLoading}
          sx={{ mt: 2 }}
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }} justifyContent="space-between">
          <Button
            variant="text"
            onClick={() => router.push('/register')}
            disabled={isLoading}
            size="small"
          >
            ¿No tienes cuenta? Regístrate
          </Button>
          
          <Button
            variant="text"
            color="secondary"
            onClick={() => setRecuperarContrasenaOpen(true)}
            disabled={isLoading}
            size="small"
          >
            ¿Olvidaste tu contraseña?
          </Button>
          
          <Button
            variant="text"
            color="warning"
            onClick={() => setRecuperarOpen(true)}
            disabled={isLoading}
            size="small"
          >
            Recuperar Cuenta Inactiva
          </Button>
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
              type="password"
              fullWidth
              value={recuperarContrasenaData.nueva_contrasena}
              onChange={(e) => setRecuperarContrasenaData(prev => ({
                ...prev,
                nueva_contrasena: e.target.value
              }))}
              margin="normal"
              helperText="Mínimo 8 caracteres"
            />

            <TextField
              label="Confirmar Contraseña"
              type="password"
              fullWidth
              value={recuperarContrasenaData.confirmar_contrasena}
              onChange={(e) => setRecuperarContrasenaData(prev => ({
                ...prev,
                confirmar_contrasena: e.target.value
              }))}
              margin="normal"
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