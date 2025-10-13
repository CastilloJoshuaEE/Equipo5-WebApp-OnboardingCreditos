'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { getSession } from 'next-auth/react';

export default function DashboardOperador() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Verificar que el usuario tenga el rol correcto
    if (session?.user?.rol && session.user.rol.toLowerCase() !== 'operador') {
      // Redirigir al dashboard correspondiente según su rol
      const userRole = session.user.rol.toLowerCase();
      switch (userRole) {
        case 'solicitante':
          router.push('/solicitante');
          break;
        default:
          router.push('/');
          break;
      }
    }
  }, [status, session, router]);

  const handleLogout = async () => {
    try {
      const currentSession = await getSession();
      
      if (currentSession?.user?.id) {
        const userId = currentSession.user.id;
        localStorage.removeItem(`solicitud_borrador_${userId}`);
        console.log('Borrador eliminado para usuario:', userId);
        
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes(`solicitud_borrador_`)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          console.log('Eliminado:', key);
        });
      }

      await signOut({ 
        callbackUrl: '/login',
        redirect: true 
      });

    } catch (error) {
      console.error('Error durante el logout:', error);
      await signOut({ callbackUrl: '/login' });
    }
  };

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, bgcolor: '#f0f4f8', minHeight: '100vh' }}>
      <Typography variant="h3" component="h1" gutterBottom color="secondary">
        Dashboard Operador
      </Typography>
      <Typography variant="h6">
        Bienvenido, {session?.user?.name || 'Usuario'} (Rol: {session?.user?.rol || 'No Definido'})
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Esta página es visible solo para el rol operador.
      </Typography>
      <Button 
        variant="outlined" 
        color="error"
        onClick={handleLogout}
        sx={{
          mt: 2,
          px: 4,
          py: 1,
          fontWeight: 'bold'
        }}
      >
        Cerrar Sesión
      </Button>
    </Box>
  );
}