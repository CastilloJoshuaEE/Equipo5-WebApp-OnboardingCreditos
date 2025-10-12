'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { UserRole } from '@/types/auth.types';
import { getSession } from 'next-auth/react';

export default function DashboardOperador() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    if (session?.user?.rol !== UserRole.OPERADOR) {
      router.push('/dashboard/solicitante');
    }
  }, [status, session, router]);
  const handleLogout = async () => {
    try {
      // Obtener la sesión actual
      const currentSession = await getSession();
      
      // Limpiar todos los borradores del usuario actual
      if (currentSession?.user?.id) {
        const userId = currentSession.user.id;
        localStorage.removeItem(`solicitud_borrador_${userId}`);
        console.log('Borrador eliminado para usuario:', userId);
        
        // Opcional: Limpiar cualquier otro dato relacionado con el usuario
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes(`solicitud_borrador_`)) {
            keysToRemove.push(key);
          }
        }
        
        // Eliminar todos los borradores (por si hay múltiples)
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          console.log('Eliminado:', key);
        });
      }

      // Cerrar sesión
      await signOut({ 
        callbackUrl: '/login',
        redirect: true 
      });

    } catch (error) {
      console.error('Error durante el logout:', error);
      // Fallback: cerrar sesión aunque falle la limpieza
      await signOut({ callbackUrl: '/login' });
    }
  };
  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, bgcolor: '#f0f4f8' }}>
      <Typography variant="h3" component="h1" gutterBottom color="secondary">
        Dashboard Operador
      </Typography>
      <Typography variant="h6">
        Bienvenido, {session?.user?.name || 'Usuario'} (Rol: {session?.user?.rol || 'No Definido'}).
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Esta página es visible solo para el rol operador.
      </Typography>
        <Button 
          variant="outlined" 
          color="error"
          onClick={handleLogout}
          sx={{
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
