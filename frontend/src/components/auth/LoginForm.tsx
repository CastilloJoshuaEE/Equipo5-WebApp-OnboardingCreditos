'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { loginSchema } from '@/schemas/auth.schema';
import type { LoginInput } from '@/types/auth.types';

export default function LoginForm() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

      console.log('🔐 Enviando credenciales:', data.email);

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      console.log('📋 Resultado del signIn:', result);

      if (result?.error) {
        console.error('❌ Error en signIn:', result.error);
        setError('Credenciales inválidas. Por favor verifica tu email y contraseña.');
        return;
      }

      // Login exitoso
      console.log('✅ Login exitoso, redirigiendo...');
      router.refresh();
      router.push('/');
      
    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Error al iniciar sesión. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
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

      <Button
        variant="text"
        fullWidth
        sx={{ mt: 1 }}
        onClick={() => router.push('/register')}
        disabled={isLoading}
      >
        ¿No tienes cuenta? Regístrate
      </Button>
    </Box>
  );
}