'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler, FieldErrors, RefCallBack, ChangeHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { 
  RegisterSolicitanteSchema, 
  RegisterOperadorSchema, 
  RegisterSolicitanteSchemaType, 
  RegisterOperadorSchemaType, 
} from '../../schemas/auth.schema'; 
import { UserRole, RegisterSolicitante, RegisterOperador } from '../../types/auth.types';
import { AuthService } from '../../services/auth.service';

import { 
  Box, 
  Button, 
  Typography, 
  Grid, 
  Tabs, 
  Tab, 
  Alert,
  TextField,
} from '@mui/material';

// --- PLACEHOLDER PARA EL COMPONENTE INPUT ---
// componente simple que envuelve textfield de mui para ser compatible con form.
interface CustomInputProps {
    label: string;
    placeholder: string;
    type?: string;
    
    onChange: ChangeHandler;
    onBlur: ChangeHandler;
    name: string;
    ref: RefCallBack;
     
    error: boolean;
    helperText: string | undefined;
}

const Input: React.FC<CustomInputProps> = React.forwardRef<HTMLInputElement, CustomInputProps>(
    ({ label, placeholder, type = 'text', error, helperText, ...props }, ref) => (
        <TextField
            fullWidth
            label={label}
            variant="outlined"
            placeholder={placeholder}
            type={type}
            error={error}
            helperText={helperText}
            {...props}
            inputRef={ref}
            size="small"
        />
    )
);
Input.displayName = 'Input';
// --- FIN PLACEHOLDER ---


type FormData = RegisterSolicitanteSchemaType | RegisterOperadorSchemaType;

const initialRole = UserRole.SOLICITANTE;

const RegisterForm: React.FC = () => {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<UserRole>(initialRole);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  
  const isSolicitante = currentRole === UserRole.SOLICITANTE;
  const resolver = isSolicitante 
    ? zodResolver(RegisterSolicitanteSchema) 
    : zodResolver(RegisterOperadorSchema);
  
   
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm<FormData>({ 
    resolver: resolver, 
    defaultValues: {
      rol: initialRole,
   
      nombre_empresa: '', 
      cuit: '',
      representante_legal: '',
      domicilio: '',
      email: '',
      password: '',
      nombre_completo: '',
      telefono: '',
      cedula_identidad: '',
    } as Partial<FormData>, 
  });

  
  const handleRoleChange = (event: React.SyntheticEvent, newValue: UserRole) => {
    setCurrentRole(newValue);
    setValue('rol', newValue); 
    reset();  
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
        

      await AuthService.register(data as RegisterSolicitante | RegisterOperador); 
      
      setSuccessMessage('Registro exitoso. Serás redirigido al Login.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (error: unknown) {
      // Manejo de errores de red
      let msg = 'Error desconocido al registrar.';
      if (error && typeof error === 'object' && 'response' in error && error.response?.data?.message) {
        msg = error.response.data.message as string;
      }
      setErrorMessage(msg);
    }
  };
  
 
  const solicitanteErrors = errors as FieldErrors<RegisterSolicitanteSchemaType>;

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 4, boxShadow: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Registro de Usuario
      </Typography>

      <Tabs 
        value={currentRole} 
        onChange={handleRoleChange} 
        centered
        sx={{ mb: 2 }}
      >
        <Tab label="Solicitante (PYME)" value={UserRole.SOLICITANTE} />
        <Tab label="Operador" value={UserRole.OPERADOR} />
      </Tabs>

      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          {/* Campos Comunes */}
          <Grid item xs={12} sm={6}>
            <Input
              label="Email"
              placeholder="email@ejemplo.com"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Input
              label="Contraseña"
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Input
              label="Nombre Completo"
              {...register('nombre_completo')}
              error={!!errors.nombre_completo}
              helperText={errors.nombre_completo?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Input
              label="Teléfono"
              {...register('telefono')}
              error={!!errors.telefono}
              helperText={errors.telefono?.message}
            />
          </Grid>
          <Grid item xs={12}>
            <Input
              label="Cédula / Identificación"
              {...register('cedula_identidad')}
              error={!!errors.cedula_identidad}
              helperText={errors.cedula_identidad?.message}
            />
          </Grid>

          {/* Campos Condicionales (Solo PYME) */}
          {isSolicitante && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  Datos de la Empresa
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Input
                  label="Nombre Empresa"
                  {...register('nombre_empresa')}
                  error={!!solicitanteErrors.nombre_empresa}
                  helperText={solicitanteErrors.nombre_empresa?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Input
                  label="CUIT"
                  placeholder="ej: 30-12345678-9"
                  {...register('cuit')}
                  error={!!solicitanteErrors.cuit}
                  helperText={solicitanteErrors.cuit?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Input
                  label="Representante Legal"
                  {...register('representante_legal')}
                  error={!!solicitanteErrors.representante_legal}
                  helperText={solicitanteErrors.representante_legal?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Input
                  label="Domicilio"
                  {...register('domicilio')}
                  error={!!solicitanteErrors.domicilio}
                  helperText={solicitanteErrors.domicilio?.message}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth 
              sx={{ mt: 2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registrando...' : 'Registrar'}
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Box textAlign="center" mt={2}>
              <Typography variant="body2">
                ¿Ya tienes cuenta? <a href="/login">Inicia Sesión</a>
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default RegisterForm;
