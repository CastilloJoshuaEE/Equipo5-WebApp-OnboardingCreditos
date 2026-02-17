//frontend/src/app/(auth)/login/page.tsx
'use client';
import { useState } from 'react';

import { Box, Typography, Backdrop, CircularProgress } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);

  const handleVolverInicio = () => {
    setIsRedirecting(true);

    // Pequeña pausa visual antes de redirigir (puedes ajustar el tiempo)
    setTimeout(() => {
      router.push('/');
    }, 800);
  };

  return (
        <>
    {/* Overlay de carga */}
      <Backdrop
        open={isRedirecting}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 2000,
          color: '#fff',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress color="inherit" />
        <Typography variant="body1">Redirigiendo al inicio...</Typography>
      </Backdrop>
    <Box
      sx={{
        backgroundColor: '#f3edf5',
        minHeight: '90vh',
        mb: '25px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      {/* Contenido principal */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          height: '100%',
          pt: '25px',
        }}
      >
        
        {/* Columna izquierda - Formulario */}
        <Box
          sx={{
            flex: 1,
            p: '15px',
            m: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: '15px',
                      cursor: 'pointer',
                      color: '#213126',
                      fontSize: '0.9rem',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                    onClick={handleVolverInicio}
                  >
                    &larr; Volver al inicio
                  </Box>
          {/* Logo */}
          <Box sx={{ mb: 2 }}>
            <Image
              src="/images/auth/logoVariante3.png"
              alt="Logo plataforma"
              width={180}
              height={60}
              style={{ display: 'block', margin: '0 auto' }}
            />
          </Box>

          {/* Título */}
          <Typography
            variant="h2"
            sx={{
              fontSize: '1.5rem',
              textAlign: 'center',
              mb: 2,
              color: '#213126',
            }}
          >
            Plataforma de créditos para PYMES
          </Typography>

   
          <LoginForm />

          {/* Características */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-evenly',
              alignItems: 'center',
              width: '100%',
              mt: 2,
            }}
          >
            {[
              { img: 'Componente46.png', text: 'Seguro y confiable' },
              { img: 'Componente45.png', text: 'Transacciones rápidas' },
              { img: 'Componente44.png', text: 'Soporte 24/7' },
            ].map((item, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <Image
                  src={`/images/auth/${item.img}`}
                  alt={item.text}
                  width={60}
                  height={60}
                  style={{ display: 'block', marginBottom: '8px' }}
                />
                <Typography sx={{ fontSize: '0.75rem', color: '#68756b' }}>
                  {item.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Columna derecha - Imagen */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            display: { xs: 'none', md: 'block' },
            borderRadius: '16px',
            overflow: 'hidden',
            m: '20px',
            pt: '6rem',
            '@media (min-width: 900px)': {
              pt: '8vh',
              pb: '8vh',
            },
          }}
        >
          <Image
            src="/images/auth/login.png"
            alt="Imagen de login"
            fill
            style={{
              objectFit: 'contain',
            }}
            priority
          />
        </Box>
      </Box>

      {/* Footer con enlace de volver */}

    </Box>
    </>
  );
}