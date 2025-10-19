'use client';

import { useState, useEffect, useRef } from 'react';
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
  FormControlLabel,
  Checkbox,
  Fade,
} from '@mui/material';
import { registerSchema, RegisterInput } from '@/schemas/auth.schema';
import { UserRole } from '@/types/auth.types';

export default function RegisterForm() {
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { rol: undefined },
    mode: 'onBlur',
  });

  const rol = watch('rol');

  const getBlock2Content = () => {
    switch (rol) {
      case UserRole.SOLICITANTE:
        return {
          img: '/images/auth/register-pyme.png',
          text: 'Registrate para acceder a herramientas que simplifican tu gestión, potencian tu crecimiento y conectan tu empresa con el futuro.',
        };
      case UserRole.OPERADOR:
        return {
          img: '/images/auth/register-operador.png',
          text: 'Administra solicitudes, valida créditos y conecta a las PYMEs con soluciones financieras diseñadas para su crecimiento.',
        };
      default:
        return {
          img: '/images/auth/register-inicial.png',
          text: 'Unite a la plataforma que impulsa el desarrollo de las PYMEs con soluciones ágiles y seguras.',
        };
    }
  };

  const block2 = getBlock2Content();

  const onSubmit = async (data: RegisterInput) => {
    try {
      setError('');
      setIsSubmitting(true);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/usuarios/registro`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en el registro');
      }

      const result = await response.json();
      console.log('Registro exitoso:', result);
      
      alert('Registro exitoso. Revisá tu email para confirmar tu cuenta.');
      router.push('/login');
      
    } catch (error) {
      console.error('Error en registro:', error);
      setError(error instanceof Error ? error.message : 'Error al registrar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#f3edf5',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2,
      }}
    >
      {/* Contenido principal */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'stretch',
          gap: 2,
          flexWrap: 'wrap',
          flexGrow: 1,
        }}
      >
        {/* Formulario */}
        <Box
          ref={formRef}
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{
            width: { xs: '100%', md: '70%' },
            bgcolor: '#fff',
            p: { xs: 2, md: 4 },
            borderRadius: 2,
            boxShadow: '0 4px 20px 0 #00000014',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
          }}
        >
          <Typography
            variant="h1"
            sx={{ fontSize: '1.6rem', textAlign: 'center', fontWeight: 'bold', mb: 2 }}
          >
            Registro de Usuario
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Selección de Rol */}
          <Typography sx={{ fontSize: '1.25rem', mt: 1, fontWeight: 'bold' }}>Rol</Typography>
          <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.rol}>
            <Select
              {...register('rol')}
              value={rol || ''}
              onChange={(e) => {
                const value = e.target.value as UserRole;
                setValue('rol', value);
                setSelectedRole(value);
                trigger('rol');
              }}
              displayEmpty
              sx={{
                fontSize: '1rem',
                borderRadius: '4px',
                '& .MuiSelect-select': { padding: '10px' },
              }}
            >
              <MenuItem value="" disabled>Seleccione un rol</MenuItem>
              <MenuItem value={UserRole.SOLICITANTE}>Solicitante PYME</MenuItem>
              <MenuItem value={UserRole.OPERADOR}>Operador</MenuItem>
            </Select>
            {errors.rol && (
              <Typography color="error" variant="caption" sx={{ mt: 0.5, ml: 2 }}>
                {errors.rol.message}
              </Typography>
            )}
          </FormControl>

          {/* Datos de contacto */}
          <Typography sx={{ fontSize: '1.25rem', mt: 2, fontWeight: 'bold' }}>Datos de contacto</Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'stretch',
              width: '100%',
            }}
          >
            <TextField 
              {...register('email')} 
              label="Email" 
              placeholder="Email"
              fullWidth 
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField 
              {...register('password')} 
              type="password" 
              label="Contraseña"
              placeholder="Password" 
              fullWidth 
              error={!!errors.password}
              helperText={errors.password?.message}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <TextField 
              {...register('telefono')} 
              label="Teléfono"
              placeholder="Teléfono" 
              fullWidth 
              error={!!errors.telefono}
              helperText={errors.telefono?.message}
            />
          </Box>

          {/* Datos Personales */}
          <Typography sx={{ fontSize: '1.25rem', mt: 2, fontWeight: 'bold' }}>Datos personales del contacto</Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'stretch',
              width: '100%',
            }}
          >
            <TextField 
              {...register('nombre_completo')} 
              label="Nombre Completo"
              placeholder="Nombre" 
              fullWidth 
              error={!!errors.nombre_completo}
              helperText={errors.nombre_completo?.message}
            />
            <TextField 
              {...register('dni')} 
              label="DNI"
              placeholder="DNI" 
              fullWidth 
              error={!!errors.dni}
              helperText={errors.dni?.message}
            />
          </Box>

          {/* Solo PYME */}
          {rol === UserRole.SOLICITANTE && (
            <>
              <Typography sx={{ fontSize: '1.25rem', mt: 2, fontWeight: 'bold' }}>Datos de la Empresa</Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: 'stretch',
                  width: '100%',
                }}
              >
                <TextField 
                  {...register('nombre_empresa')} 
                  label="Nombre de la Empresa"
                  placeholder="Nombre de la Empresa" 
                  fullWidth 
                  error={!!errors.nombre_empresa}
                  helperText={errors.nombre_empresa?.message}
                />
                <TextField 
                  {...register('cuit')} 
                  label="CUIT"
                  placeholder="CUIT" 
                  fullWidth 
                  error={!!errors.cuit}
                  helperText={errors.cuit?.message}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <TextField 
                  {...register('domicilio')} 
                  label="Domicilio de la Empresa"
                  placeholder="Domicilio de la Empresa" 
                  fullWidth 
                  error={!!errors.domicilio}
                  helperText={errors.domicilio?.message}
                />
              </Box>

              <Typography sx={{ fontSize: '1.25rem', mt: 2, fontWeight: 'bold' }}>Representante Legal</Typography>
              <TextField 
                {...register('representante_legal')} 
                label="Representante Legal"
                placeholder="Representante Legal" 
                fullWidth 
                error={!!errors.representante_legal}
                helperText={errors.representante_legal?.message}
              />
            </>
          )}

          {/* Términos y Condiciones */}
          <FormControlLabel
            control={<Checkbox required />}
            label="Al registrarse, acepta nuestros Términos y Condiciones y nuestra política de Privacidad"
            sx={{ fontSize: '0.85rem', mt: 2 }}
          />

          {/* Botón de Registro */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            sx={{
              mt: 2,
              bgcolor: '#cdb9d8',
              color: '#fff',
              textTransform: 'none',
              padding: '0.75rem',
              fontSize: '1.15rem',
              letterSpacing: '0.15rem',
              '&:hover': { bgcolor: '#b792c9' },
              '&:disabled': {
                backgroundColor: '#e0e0e0',
                color: '#9e9e9e'
              }
            }}
          >
            {isSubmitting ? 'Registrando...' : rol === UserRole.SOLICITANTE ? 'Registrar Solicitante Pyme' : 'Registrarse'}
          </Button>

          {/* Enlace a Login */}
          <Typography sx={{ textAlign: 'center', fontSize: '0.875rem', color: '#9ba39c', mt: 1 }}>
            ¿Ya tenés una cuenta?{' '}
            <Box 
              component="span" 
              sx={{ color: '#da68f2', cursor: 'pointer' }} 
              onClick={() => router.push('/login')}
            >
              Iniciar Sesión
            </Box>
          </Typography>
        </Box>

        {/* Panel lateral informativo */}
        <Fade in timeout={600} key={rol}>
          <Box
            sx={{
              width: { xs: '0%', md: '28%' },
              bgcolor: '#f3cdfb',
              borderRadius: '16px',
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-evenly',
              p: 2,
            }}
          >
            <Box
              component="img"
              src={block2.img}
              alt="Imagen de rol"
              sx={{ height: '40%', objectFit: 'contain' }}
            />
            <Typography
              variant="h3"
              sx={{ fontSize: '1.5rem', textAlign: 'center', lineHeight: 1.2, fontWeight: 'bold' }}
            >
              Impulsa el crecimiento de las PYMEs
            </Typography>
            <Typography sx={{ fontSize: '1rem', color: '#364739', textAlign: 'center', px: 2 }}>
              {block2.text}
            </Typography>
          </Box>
        </Fade>
      </Box>

      {/* Enlace para volver al inicio */}
      <Typography
        sx={{
          textAlign: 'center',
          fontSize: '0.85rem',
          cursor: 'pointer',
          mt: 1,
          color: '#6b6b6b',
          '&:hover': { textDecoration: 'underline' },
        }}
        onClick={() => router.push('/')}
      >
        &larr; Volver al inicio
      </Typography>
    </Box>
  );
}