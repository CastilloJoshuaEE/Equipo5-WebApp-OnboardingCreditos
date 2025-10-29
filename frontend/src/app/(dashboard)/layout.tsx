// frontend/src/app/(dashboard)/layout.tsx
'use client';
import { signOut } from 'next-auth/react';
import { useTheme } from '@mui/material/styles';
import { ThemeProvider, CssBaseline } from "@mui/material";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ 
      callbackUrl: '/login',
      redirect: true 
    });
  };

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

  if (!session) return null;

  const handleVerPerfil = () => router.push('/usuario/perfil');
  const handleIrDashboard = () => router.push('/');

  const SidebarContent = () => (
    <aside className="sidebar">
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontSize: '1.1rem',
            fontWeight: '600',
            color: 'primary.main'
          }}
        >
          {session.user.rol === 'operador' ? 'Panel de Operador' : 'Mi Espacio'}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          {session.user.name || session.user.email}
        </Typography>
      </Box>
      
      <nav className="sidebar-nav">
        
        <DynamicNavigation onNavigate={() => isMobile && setSidebarOpen(false)} />
        
        {/* Botón de salir */}
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Button 
            variant="outlined" 
            color="error"
            onClick={handleLogout}
            fullWidth
            size="small"
          >
Salir          </Button>
        </Box>
      </nav>
    </aside>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display="flex">
        {/* Sidebar permanente en escritorio */}
        {!isMobile && <SidebarContent />}

        {/* Drawer para mobile */}
        {isMobile && (
          <Drawer
            variant="temporary"
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                width: 280,
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
              },
            }}
          >
            <SidebarContent />
          </Drawer>
        )}

        {/* Contenido principal */}
        <Box flexGrow={1} sx={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
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
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              <Box display="flex" alignItems="center" gap={1}>
                {isMobile && (
                  <IconButton onClick={() => setSidebarOpen(true)}>
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

              <Box display="flex" alignItems="center" gap={2}>
                <Button
                  color="inherit"
                  startIcon={<Person />}
                  onClick={handleVerPerfil}
                  sx={{
                    textTransform: 'none',
                    '&:hover': { backgroundColor: 'action.hover' },
                  }}
                >
                  Mi Perfil
                </Button>

                <NotificacionesBell />
              </Box>
            </Toolbar>
          </AppBar>

          {/* Contenido dinámico */}
          <Box component="main" p={2}>
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}