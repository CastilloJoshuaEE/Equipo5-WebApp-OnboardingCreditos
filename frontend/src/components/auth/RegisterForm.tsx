import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, Button, TextField, Typography, Alert, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { registerSchema, RegisterInput } from '@/schemas/auth.schema';
import { UserRole } from '@/types/auth.types';

export default function RegisterForm() {
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      rol: undefined
    },
    mode: 'onBlur' //para que valide al salir del campo
  });

  const rol = watch('rol');

  const onSubmit = async (data: RegisterInput) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en el registro');
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
      setError(error instanceof Error ? error.message : 'Error al registrar usuario');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} width="100%" maxWidth={500} p={3}>
      <Typography variant="h4" component="h1" textAlign="center" gutterBottom>
        Registro de Usuario
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
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

      <Button
        variant="text"
        fullWidth
        sx={{ mt: 1 }}
        onClick={() => router.push('/login')}
      >
        ¿Ya tienes cuenta? Inicia sesión
      </Button>
    </Box>
  );
}