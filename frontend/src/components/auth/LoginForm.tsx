'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';

import { LoginSchema, LoginSchemaType } from '@/schemas/auth.schema';
import { Box, Button, Typography, Alert } from '@mui/material';
import Input from '@/components/ui/Input';


const LoginForm: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit: SubmitHandler<LoginSchemaType> = async (data) => {
    setErrorMessage(null);

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
     
      redirect: true,
      callbackUrl: '/', // Se redirigira desde middleware/layout cada rol
    });

    if (result?.error) {
    
      setErrorMessage('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
    }
    // Si no hay error, NextAuth maneja la redirección a la callbackUrl ('/') 
    // y luego el middleware lo lleva al dashboard correcto.
  };

  return (
    <Box sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 8, boxShadow: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Inicio de Sesión
      </Typography>

      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Email"
          placeholder="email@ejemplo.com"
          {...register('email')}
          register={register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <Input
          label="Contraseña"
          type="password"
          {...register('password')}
          register={register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
        />

        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          fullWidth 
          sx={{ mt: 3 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Iniciando...' : 'Entrar'}
        </Button>
        
        <Box textAlign="center" mt={2}>
            <Typography variant="body2">
                ¿Olvidaste tu contraseña? <a href="/forgot-password">Recuperar</a>
            </Typography>
            <Typography variant="body2">
                ¿No tienes cuenta? <a href="/register">Regístrate aquí</a>
            </Typography>
        </Box>
      </form>
    </Box>
  );
};

export default LoginForm;


