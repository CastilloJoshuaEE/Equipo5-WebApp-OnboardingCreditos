// frontend/src/app/solicitante/page.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  Tab,
  Tabs,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  CreditCard as CreditCardIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
  HelpOutline as HelpOutlineIcon
} from '@mui/icons-material';
import { UserRole } from '@/types/auth.types';
import SolicitudCreditoForm from '@/components/solicitudes/SolicitudCreditoForm';
import ListaSolicitudes from '@/components/solicitudes/ListaSolicitudes';
import PlantillasDocumento from '@/components/solicitante/PlantillasDocumento';
import { useSessionExpired } from '@/providers/SessionExpiredProvider';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`solicitante-tabpanel-${index}`}
      aria-labelledby={`solicitante-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  amount: string;
  subtitle: string;
  icon: React.ReactNode;
  color?: string;
}

function SummaryCard({ title, amount, subtitle, icon, color }: SummaryCardProps) {
  return (
    <Card className="summary-card">
      <CardContent>
        <Box className="card-header">
          <Typography variant="h6" className="card-title">{title}</Typography>
          <Box className="card-icon">{icon}</Box>
        </Box>
        <Typography variant="h4" className="card-amount" sx={{ color }}>
          {amount}
        </Typography>
        <Typography variant="body2" className="card-subtitle">{subtitle}</Typography>
      </CardContent>
    </Card>
  );
}

export default function DashboardSolicitante() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [solicitudActiva, setSolicitudActiva] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { showSessionExpired } = useSessionExpired();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (session?.user?.rol && session.user.rol !== UserRole.SOLICITANTE) {
      router.push('/operador');
    }
  }, [status, session, router]);

  // Verificar token expirado periódicamente
  useEffect(() => {
    const checkTokenExpiry = () => {
      if (session?.accessToken) {
        try {
          const payload = JSON.parse(atob(session.accessToken.split('.')[1]));
          const exp = payload.exp * 1000;
          const now = Date.now();
          
          if (now >= exp) {
            console.log('Token expirado detectado');
            showSessionExpired();
          }
        } catch (error) {
          console.error('Error verificando token:', error);
        }
      }
    };

    // Verificar cada 30 segundos
    const interval = setInterval(checkTokenExpiry, 30000);
    checkTokenExpiry(); // Verificar inmediatamente

    return () => clearInterval(interval);
  }, [session, showSessionExpired]);

  // Cargar la solicitud activa
  useEffect(() => {
    const cargarSolicitudActiva = async () => {
      try {
        const session = await getSession();
        if (!session?.accessToken) return;

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${API_URL}/solicitudes/mis-solicitudes`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          const solicitud = result.data?.find((s: any) => 
            s.estado === 'borrador' || s.estado === 'enviado'
          );
          if (solicitud) {
            setSolicitudActiva(solicitud.id);
          }
        } else if (response.status === 401) {
          showSessionExpired();
        }
      } catch (error) {
        console.error('Error cargando solicitud activa:', error);
      }
    };

    if (session) {
      cargarSolicitudActiva();
    }
  }, [session, showSessionExpired]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleLogout = async () => {
    await signOut({ 
      callbackUrl: '/login',
      redirect: true 
    });
  };

  const handleVerDetalles = (solicitudId: string) => {
    router.push(`/solicitante/solicitudes/${solicitudId}`);
  };

  const handleNuevaSolicitud = () => {
    setTabValue(0);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Función para manejar el éxito del formulario
  const handleSuccessSolicitud = () => {
    setMessage('Solicitud creada exitosamente');
    setTabValue(1);
  };

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  return (
    <Box className="dashboard-container">
      {/* Main Content */}
      <main className="main-content">
        <section className="page-content">
          {/* Header con Bienvenida */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h1" className="page-title">
              Dashboard Solicitante PYME
            </Typography>
            <Typography variant="subtitle1" className="page-subtitle">
              Bienvenido {session?.user?.name || 'Usuario'}, gestión de solicitudes de crédito
            </Typography>
            <Chip 
              label="Solicitante" 
              color="primary" 
              variant="outlined" 
              sx={{ mt: 1 }}
            />
          </Box>

          {/* Alertas */}
          {message && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Complete su solicitud de crédito y suba toda la documentación requerida para agilizar el proceso.
          </Alert>

          {/* Tarjetas de Métricas */}
          <Grid container spacing={3} className="metrics-grid" sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <SummaryCard
                title="Total solicitado"
                amount="$ 5.000.000"
                subtitle="Solicitudes activas 1"
                icon={<DescriptionIcon />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SummaryCard
                title="Crédito aprobado"
                amount="$ 0"
                subtitle="Total disponible"
                icon={<CheckCircleIcon />}
                color="#28a745"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SummaryCard
                title="En revisión"
                amount="1"
                subtitle="Respuesta en 24h"
                icon={<ScheduleIcon />}
                color="#ffc107"
              />
            </Grid>
          </Grid>

          {/* Tabs Principal */}
          <Card className="content-box">
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Nueva solicitud" />
                <Tab label="Mis solicitudes" />
                <Tab label="Plantilla de documentos" />
              </Tabs>
            </Box>

            {/* Contenido de Tabs */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h5" gutterBottom>
                  Nueva solicitud de crédito
                </Typography>
                <SolicitudCreditoForm />
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box sx={{ mt: 2 }}>
                <ListaSolicitudes />
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h5" gutterBottom>
                  Plantilla de Documentos
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                  Aquí podrás ver y descargar los archivos Word de ejemplo disponibles.
                  Recuerde subir los archivos en formato PDF
                </Typography>
                <PlantillasDocumento />
              </Box>
            </TabPanel>
          </Card>
        </section>
      </main>
    </Box>
  );
}