'use client';

import { Box, Typography, TextField, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();

  return (
    <Box
      sx={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0px 4px 20px 0px #0000001A',
        py: 2,
        px: { xs: 2, md: 4 },
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mb: 2,
      }}
    >

      <Typography
        variant="h1"
        sx={{
          fontSize: '1.25rem',
          fontWeight: 600,
          textAlign: 'center',
          mb: 1,
          color: '#213126',
        }}
      >
        Iniciar sesión
      </Typography>


      <Typography
        variant="h3"
        sx={{
          fontSize: '1rem',
          textAlign: 'center',
          color: '#9ba39c',
          mb: 2,
        }}
      >
        Ingresa tus credenciales para acceder a tu cuenta
      </Typography>


      <TextField
        label="Email"
        placeholder="Email"
        type="email"
        fullWidth
        sx={{ mb: 2 }}
      />
      <TextField
        label="Contraseña"
        placeholder="Password"
        type="password"
        fullWidth
        sx={{ mb: 3 }}
      />

   
      <Button
        variant="contained"
        fullWidth
        sx={{
          backgroundColor: '#CDB9D8',
          color: '#68756b',
          fontSize: '1rem',
          letterSpacing: '0.46px',
          textTransform: 'uppercase',
          mb: 2,
          '&:hover': {
            backgroundColor: '#bca4c7',
          },
        }}
      >
        Inicia sesión
      </Button>

    
      <Typography sx={{ textAlign: 'center', fontSize: '0.875rem', color: '#9ba39c' }}>
        ¿No tenés cuenta?{' '}
        <Box
          component="span"
          sx={{
            color: '#DA68F2',
            fontSize: '1rem',
            letterSpacing: '0.15px',
            cursor: 'pointer',
          }}
          onClick={() => router.push('/register')}
        >
          Registrate aquí
        </Box>
      </Typography>
    </Box>
  );
}
