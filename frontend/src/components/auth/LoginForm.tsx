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
  const router = useRouter();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit: SubmitHandler<LoginInput> = async (data) => {
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password
      });

      if (result?.error) {
        setError('Credenciales inválidas');
        return;
      }

      router.refresh();
      //!! error dice que esta definida pero no usada volver a ver
    } catch (error) {
      setError('Error al iniciar sesión');
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
        fullWidth
        margin="normal"
        error={!!errors.email}
        helperText={errors.email?.message}
      />

      <TextField
        {...register('password')}
        type="password"
        label="Contraseña"
        fullWidth
        margin="normal"
        error={!!errors.password}
        helperText={errors.password?.message}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={isSubmitting}
        sx={{ mt: 2 }}
      >
        {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </Button>
    </Box>
  );
}


