'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, Button, Container, Typography } from '@mui/material';
import { UserRole } from '@/types/auth.types';

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleGetStarted = () => {
    if (session) {
      
      const path = session.user?.rol === UserRole.SOLICITANTE 
        ? '/dashboard/solicitante' 
        : '/dashboard/operador';
      router.push(path);
    } else {
      router.push('/login');
    }
  };

  return (
    <Container maxWidth="md">
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="100vh"
        gap={4}
      >
        <Typography variant="h2" component="h1" textAlign="center">
          Bienvenido al Sistema de CREDITOS PYME
        </Typography>
        
        <Typography variant="h5" textAlign="center">
          Plataforma integral para la gestion de creditos empresariales
        </Typography>

        <Box display="flex" gap={2}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={handleGetStarted}
          >
            {session ? 'Ir al Dashboard' : 'Comenzar'}
          </Button>
          
          {!session && (
            <Button 
              variant="outlined" 
              color="primary" 
              size="large"
              onClick={() => router.push('/register')}
            >
              Registrarse
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
}
