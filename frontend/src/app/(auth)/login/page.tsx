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
  DialogActions
} from '@mui/material';
import { loginSchema } from '@/schemas/auth.schema';
import type { LoginInput } from '@/types/auth.types';

export default function LoginForm() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recuperarOpen, setRecuperarOpen] = useState(false);
  const [emailRecuperacion, setEmailRecuperacion] = useState('');
  const [recuperarLoading, setRecuperarLoading] = useState(false);
  const [recuperarMessage, setRecuperarMessage] = useState('');
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

      console.log('. Enviando credenciales:', data.email);

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      console.log('. Resultado del signIn:', result);

      if (result?.error) {
        console.error('. Error en signIn:', result.error);
        setError('Credenciales inválidas. Por favor verifica tu email y contraseña.');
        return;
      }

      // Login exitoso
      console.log('. Login exitoso, redirigiendo...');
      router.refresh();
      router.push('/');
      
    } catch (error) {
      console.error('. Login error:', error);
      setError('Error al iniciar sesión. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            variant="text"
            onClick={() => router.push('/register')}
            disabled={isLoading}
          >
            ¿No tienes cuenta? Regístrate
          </Button>
          
          <Button
            variant="text"
            color="secondary"
            onClick={() => setRecuperarOpen(true)}
            disabled={isLoading}
          >
            Recuperar Cuenta
          </Button>
        </Box>
      </Box>

      {/* Modal de Recuperar Cuenta */}
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