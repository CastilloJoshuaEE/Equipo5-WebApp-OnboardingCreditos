import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, Button, TextField, Typography, Alert, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { registerSchema } from '@/schemas/auth.schema';
import type { RegisterInput } from '@/types/auth.types';
import { UserRole } from '@/types/auth.types';

export default function RegisterForm() {
  const [error, setError] = useState('');
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error en el registro');
      }

      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password
      });

      if (result?.error) {
        setError('Error al iniciar sesión automáticamente');
        return;
      }

      router.refresh();
    } catch (error) {
      setError('Error al registrar usuario');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} width="100%" maxWidth={400} p={3}>
      <Typography variant="h4" component="h1" textAlign="center" gutterBottom>
        Registro de Usuario
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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

      <FormControl fullWidth margin="normal">
        <InputLabel>Rol</InputLabel>
        <Select
          {...register('rol')}
          label="Rol"
          error={!!errors.rol}
        >
          <MenuItem value={UserRole.SOLICITANTE}>Solicitante PYME</MenuItem>
          <MenuItem value={UserRole.OPERADOR}>Operador</MenuItem>
        </Select>
      </FormControl>

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
        {isSubmitting ? 'Registrando...' : 'Registrarse'}
      </Button>
    </Box>
  );
}