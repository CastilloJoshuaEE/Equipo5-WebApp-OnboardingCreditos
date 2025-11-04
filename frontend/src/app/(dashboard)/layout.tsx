'use client';
import { signOut } from 'next-auth/react';
import { useTheme } from '@mui/material/styles';
import { ThemeProvider, CssBaseline } from "@mui/material";
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  useMediaQuery,
  AppBar,
  Toolbar,
  Button,
  Typography,
  Backdrop
} from '@mui/material';
import { Menu, Person } from '@mui/icons-material';
import { NotificacionesBell } from '@/components/notificaciones/NotificacionesBell';
import { DynamicNavigation } from '@/components/layout/DynamicNavigation';
import Image from 'next/image';
import './dashboard-styles.css';

// Importa tu tema MUI
import theme from '@/styles/theme';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  const handleLogout = async () => {
    try {
      setLoadingOverlay(true);
      await new Promise((res) => setTimeout(res, 150));
      await signOut({
        callbackUrl: '/login',
        redirect: true,
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setLoadingOverlay(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (pathname !== lastPathname) {
      setLastPathname(pathname);
      if (loadingOverlay) {
        setLoadingOverlay(false);
      }
    }
  }, [pathname, loadingOverlay, lastPathname]);

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!session) return null;

  const navigateWithOverlay = (path: string) => {
    if (pathname === path) {
      if (isMobile) setSidebarOpen(false);
      return;
    }
    
    setLoadingOverlay(true);
    if (isMobile) setSidebarOpen(false);
    router.push(path);
  };

  const handleVerPerfil = () => navigateWithOverlay('/usuario/perfil');
  const handleIrDashboard = () => navigateWithOverlay('/');

  const SidebarContent = () => (
    <Box 
      sx={{ 
        width: 280,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        borderRight: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* Header del Sidebar */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontSize: '1.1rem',
            fontWeight: '600',
            color: 'primary.main'
          }}
        >
          {session.user.rol === 'operador' ? 'Panel de Operador' : 'Mi espacio'}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          {session.user.name || session.user.email}
        </Typography>
      </Box>
      
      {/* Navegación */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <DynamicNavigation 
          navigationHandler={navigateWithOverlay} 
          onNavigate={() => { if (isMobile) setSidebarOpen(false); }} 
        />
      </Box>
      
      {/* Botón de salir */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button 
          variant="outlined" 
          color="error"
          onClick={handleLogout}
          fullWidth
          size="small"
        >
          Salir
        </Button>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar para escritorio */}
        {!isMobile && <SidebarContent />}

        {/* Drawer para móvil */}
        {isMobile && (
          <Drawer
            variant="temporary"
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            ModalProps={{
              keepMounted: true, // Mejor rendimiento en móvil
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: 280,
              },
            }}
          >
            <SidebarContent />
          </Drawer>
        )}

        {/* Overlay de carga */}
        <Backdrop
          sx={{ 
            color: '#fff', 
            zIndex: (theme) => theme.zIndex.drawer + 2,
            backgroundColor: 'rgba(0, 0, 0, 0.8)'
          }}
          open={loadingOverlay}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress color="inherit" />
            <Typography variant="h6">Cargando...</Typography>
          </Box>
        </Backdrop>

        {/* Contenido principal */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            backgroundColor: '#fafafa'
          }}
        >
          {/* AppBar */}
          <AppBar
            position="static"
            elevation={0}
            sx={{
              backgroundColor: 'white',
              color: 'text.primary',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1, sm: 2 } }}>
              <Box display="flex" alignItems="center" gap={1}>
                {isMobile && (
                  <IconButton 
                    onClick={() => setSidebarOpen(true)}
                    sx={{ mr: 1 }}
                  >
                    <Menu />
                  </IconButton>
                )}
                <Image
                  src="/logos/logoVariant3.svg"
                  alt="Logo Nexia"
                  width={120}
                  height={40}
                  priority
                  onClick={handleIrDashboard}
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />
              </Box>

              <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
                <Button
                  color="inherit"
                  startIcon={<Person />}
                  onClick={handleVerPerfil}
                  sx={{
                    textTransform: 'none',
                    '&:hover': { backgroundColor: 'action.hover' },
                    display: { xs: 'none', sm: 'flex' } // Ocultar texto en móvil muy pequeño
                  }}
                >
                  Mi perfil
                </Button>

                <NotificacionesBell />
              </Box>
            </Toolbar>
          </AppBar>

          {/* Contenido de la página */}
          <Box 
            component="div" 
            sx={{ 
              flex: 1,
              p: { xs: 1, sm: 2 },
              overflow: 'auto'
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}