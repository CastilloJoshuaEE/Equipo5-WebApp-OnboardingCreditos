'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { registerSchema, RegisterInput } from '@/schemas/auth.schema';
import { UserRole } from '@/types/auth.types';

export default function RegisterForm() {
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      rol: undefined,
    },
    mode: 'onBlur',
  });

  const rol = watch('rol');

  useEffect(() => {
    // Guarda el rol en localStorage para que el layout sepa qué imagen mostrar
    if (selectedRole) {
      window.localStorage.setItem('selectedRole', selectedRole);
    } else {
      window.localStorage.removeItem('selectedRole');
    }
  }, [selectedRole]);

  const onSubmit = async (data: RegisterInput) => {
    try {
      setError('');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/usuarios/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en el registro');
      }

      alert('Registro exitoso. Revisá tu email para confirmar tu cuenta.');
      router.push('/login');
    } catch (error) {
      console.error('Error en registro:', error);
      setError(error instanceof Error ? error.message : 'Error al registrar usuario');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        width: '100%',
        maxWidth: 450,
        bgcolor: '#fff',
        p: 4,
        borderRadius: 3,
        boxShadow: 3,
      }}
    >
      <Typography
        variant="h5"
        textAlign="center"
        sx={{ mb: 3, fontWeight: 'bold', fontFamily: 'Roboto' }}
      >
        Registro de Usuario
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Selección de rol */}
      <FormControl fullWidth margin="normal">
        <InputLabel>Rol</InputLabel>
        <Select
          value={rol || ''}
          onChange={(e) => {
            const value = e.target.value as UserRole;
            setValue('rol', value);
            setSelectedRole(value);
          }}
          label="Rol"
          error={!!errors.rol}
        >
          <MenuItem value={UserRole.SOLICITANTE}>Solicitante PYME</MenuItem>
          <MenuItem value={UserRole.OPERADOR}>Operador</MenuItem>
        </Select>
        {errors.rol && (
          <Typography color="error" variant="caption" sx={{ mt: 0.5, ml: 2 }}>
            {errors.rol.message}
          </Typography>
        )}
      </FormControl>

      {/* Campos comunes */}
      <TextField
        {...register('nombre_completo')}
        label="Nombre Completo"
        fullWidth
        margin="normal"
        error={!!errors.nombre_completo}
        helperText={errors.nombre_completo?.message}
      />

      <TextField
        {...register('email')}
        label="Correo electrónico"
        fullWidth
        margin="normal"
        error={!!errors.email}
        helperText={errors.email?.message}
      />

      <TextField
        {...register('dni')}
        label="DNI"
        fullWidth
        margin="normal"
        error={!!errors.dni}
        helperText={errors.dni?.message}
      />

      <TextField
        {...register('telefono')}
        label="Teléfono"
        fullWidth
        margin="normal"
        error={!!errors.telefono}
        helperText={errors.telefono?.message}
      />

      {/* Campos adicionales para Solicitante PYME */}
      {rol === UserRole.SOLICITANTE && (
        <>
          <Typography
            variant="h6"
            sx={{
              mt: 3,
              mb: 1,
              fontSize: '1.25rem',
              fontFamily: 'Roboto',
              fontWeight: 500,
            }}
          >
            Datos de la Empresa
          </Typography>

          <TextField
            {...register('nombre_empresa')}
            label="Nombre de la Empresa"
            fullWidth
            margin="normal"
            error={!!errors.nombre_empresa}
            helperText={errors.nombre_empresa?.message}
          />

          <TextField
            {...register('cuit')}
            label="CUIT (ej: 30-12345678-9)"
            fullWidth
            margin="normal"
            error={!!errors.cuit}
            helperText={errors.cuit?.message}
            placeholder="30-12345678-9"
          />

          <TextField
            {...register('representante_legal')}
            label="Representante Legal"
            fullWidth
            margin="normal"
            error={!!errors.representante_legal}
            helperText={errors.representante_legal?.message}
          />

          <TextField
            {...register('domicilio')}
            label="Domicilio de la Empresa"
            fullWidth
            margin="normal"
            error={!!errors.domicilio}
            helperText={errors.domicilio?.message}
          />
        </>
      )}

      {/* Contraseña */}
      <TextField
        {...register('password')}
        type="password"
        label="Contraseña"
        fullWidth
        margin="normal"
        error={!!errors.password}
        helperText={errors.password?.message}
      />

      {/* Botones */}
      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={isSubmitting}
        sx={{
          mt: 3,
          bgcolor: '#CD89D8',
          '&:hover': { bgcolor: '#b573c3' },
          textTransform: 'none',
          fontSize: '0.8125rem',
        }}
      >
        {isSubmitting ? 'Registrando...' : 'Registrarse'}
      </Button>

      <Button
        variant="text"
        fullWidth
        sx={{
          mt: 2,
          color: '#DA68F2',
          textTransform: 'none',
          fontSize: '0.8125rem',
        }}
        onClick={() => router.push('/login')}
      >
        ¿Ya tienes cuenta? Inicia sesión
      </Button>
    </Box>
  );
}
