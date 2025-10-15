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
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
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
      sx={{
        width: '100%',
        minheight: '85vh',
       /* overflowY: 'hidden', revisar porque no sirve con solicitud pyme */
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2,
      }}
    >
    
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

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

     
          <Typography sx={{ fontSize: '1.25rem', mt: 1 }}>Rol</Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Select
              value={rol || ''}
              onChange={(e) => {
                const value = e.target.value as UserRole;
                setValue('rol', value);
                setSelectedRole(value);
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
          </FormControl>

      
          <Typography sx={{ fontSize: '1.25rem', mt: 2 }}>Datos de contacto</Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'stretch',
              width: '100%',
            }}
          >
            <TextField {...register('email')} placeholder="Email" fullWidth />
            <TextField {...register('password')} type="password" placeholder="Password" fullWidth />
          </Box>
          <Box sx={{ mt: 2 }}>
            <TextField {...register('telefono')} placeholder="Teléfono" fullWidth />
          </Box>

          {/* DATOS PERSONALES */}
          <Typography sx={{ fontSize: '1.25rem', mt: 2 }}>Datos personales del contacto</Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'stretch',
              width: '100%',
            }}
          >
            <TextField {...register('nombre_completo')} placeholder="Nombre" fullWidth />
            <TextField {...register('dni')} placeholder="DNI" fullWidth />
          </Box>

          {/* SOLO PYME */}
          {rol === UserRole.SOLICITANTE && (
            <>
              <Typography sx={{ fontSize: '1.25rem', mt: 2 }}>Datos de la Empresa</Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: 'stretch',
                  width: '100%',
                }}
              >
                <TextField {...register('nombre_empresa')} placeholder="Nombre de la Empresa" fullWidth />
                <TextField {...register('cuit')} placeholder="CUIT" fullWidth />
              </Box>
              <Box sx={{ mt: 2 }}>
                <TextField {...register('domicilio')} placeholder="Domicilio de la Empresa" fullWidth />
              </Box>

              <Typography sx={{ fontSize: '1.25rem', mt: 2 }}>Representante Legal</Typography>
              <TextField {...register('representante_legal')} placeholder="Representante Legal" fullWidth />
            </>
          )}

      
          <FormControlLabel
            control={<Checkbox />}
            label="Al registrarse, acepta nuestros Términos y Condiciones y nuestra política de Privacidad"
            sx={{ fontSize: '0.85rem', mt: 2 }}
          />

      
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
            }}
          >
            {rol === UserRole.SOLICITANTE ? 'Registrar Solicitante Pyme' : 'Registrarse'}
          </Button>

         
          <Typography sx={{ textAlign: 'center', fontSize: '0.875rem', color: '#9ba39c', mt: 1 }}>
            ¿Ya tenés una cuenta?{' '}
            <Box component="span" sx={{ color: '#da68f2', cursor: 'pointer' }} onClick={() => router.push('/login')}>
              Iniciar Sesión
            </Box>
          </Typography>
        </Box>

    
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
