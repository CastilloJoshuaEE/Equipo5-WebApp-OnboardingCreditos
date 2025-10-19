'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, CircularProgress, Button, AppBar, Toolbar, Typography } from '@mui/material';
import { NotificacionesBell } from '@/components/notificaciones/NotificacionesBell';
import { Person } from '@mui/icons-material';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return null;
  }

  const handleVerPerfil = () => {
    router.push('/usuario/perfil');
  };

  const handleIrDashboard = () => {
    if (session?.user?.rol) {
      const userRole = session.user.rol.toLowerCase();

      switch (userRole) {
        case 'solicitante':
          router.push('/solicitante');
          break;
        case 'operador':
          router.push('/operador');
          break;
        default:
          router.push('/');
          break;
      }
    } else {
      console.warn('No se pudo determinar el rol del usuario, redirigiendo al home');
      router.push('/');
    }
  };

  return (
    <Box>
      <AppBar position="static" elevation={0} sx={{ backgroundColor: 'white', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={handleIrDashboard}
          >
            Nexia
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              color="inherit"
              startIcon={<Person />}
              onClick={handleVerPerfil}
              sx={{ 
                textTransform: 'none',
                '&:hover': { backgroundColor: 'action.hover' }
              }}
            >
              Mi Perfil
            </Button>

            <NotificacionesBell />
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main">
        {children}
      </Box>
    </Box>
  );
}
