// frontend/src/app/(dashboard)/solicitante/page.tsx
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
  IconButton,
  useMediaQuery,
  useTheme,
  LinearProgress
} from '@mui/material';
import { 
  CreditCard as CreditCardIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
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
      {value === index && <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>{children}</Box>}
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
    <Card className="summary-card" sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 2, md: 2 } }}>
        <Box className="card-header">
          <Typography variant="h6" className="card-title" sx={{ fontSize: { xs: '0.875rem', sm: '0.9rem', md: '1rem' } }}>
            {title}
          </Typography>
          <Box className="card-icon" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            {icon}
          </Box>
        </Box>
        <Typography 
          variant="h4" 
          className="card-amount" 
          sx={{ 
            color,
            fontSize: { xs: '1.5rem', sm: '1.6rem', md: '1.8rem' },
            fontWeight: 'bold',
            my: 1
          }}
        >
          {amount}
        </Typography>
        <Typography 
          variant="body2" 
          className="card-subtitle"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' } }}
        >
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

interface SolicitudStats {
  totalSolicitado: number;
  totalAprobadas: number;
  enRevision: number;
  solicitudesActivas: number;
}

export default function DashboardSolicitante() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tabValue, setTabValue] = useState(0);
  const [solicitudActiva, setSolicitudActiva] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<SolicitudStats>({
    totalSolicitado: 0,
    totalAprobadas: 0,
    enRevision: 0,
    solicitudesActivas: 0
  });
  const [loading, setLoading] = useState(true);
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

  // Cargar estadísticas de solicitudes
  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
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
        const solicitudes = result.data || [];

        // Calcular estadísticas
        const totalSolicitado = solicitudes
          .filter((s: any) => s.estado !== 'rechazado')
          .reduce((sum: number, s: any) => sum + (s.monto || 0), 0);

        const totalAprobadas = solicitudes
          .filter((s: any) => s.estado === 'aprobado').length;

        const enRevision = solicitudes
          .filter((s: any) => 
            s.estado === 'en_revision' || 
            s.estado === 'pendiente_info' ||
            s.estado === 'enviado'
          ).length;

        const solicitudesActivas = solicitudes
          .filter((s: any) => 
            s.estado === 'borrador' || 
            s.estado === 'enviado' || 
            s.estado === 'en_revision' || 
            s.estado === 'pendiente_info'
          ).length;

        setStats({
          totalSolicitado,
          totalAprobadas,
          enRevision,
          solicitudesActivas
        });

        // Establecer solicitud activa
        const solicitudActiva = solicitudes.find((s: any) => 
          s.estado === 'borrador' || s.estado === 'enviado'
        );
        if (solicitudActiva) {
          setSolicitudActiva(solicitudActiva.id);
        }
      } else if (response.status === 401) {
        showSessionExpired();
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Cargar estadísticas cuando cambie la sesión
  useEffect(() => {
    if (session) {
      cargarEstadisticas();
    }
  }, [session, showSessionExpired]);

  // Verificar operador asignado
  useEffect(() => {
    const verificarOperadorAsignado = async () => {
      try {
        const session = await getSession();
        if (!session?.accessToken) return;

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        // Obtener notificaciones no leídas
        const response = await fetch(`${API_URL}/notificaciones?leida=false&tipo=operador_asignado`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          const notificacionesOperador = result.data || [];

          // Mostrar alert para cada notificación de operador asignado
          notificacionesOperador.forEach((notif: any) => {
            if (notif.datos_adicionales?.operador_nombre) {
              alert(`Se ha asignado el operador ${notif.datos_adicionales.operador_nombre} a tu solicitud. \n\nPuedes comunicarte con él para cualquier consulta sobre tu solicitud de crédito.`);
              
              // Marcar como leída después de mostrar el alert
              fetch(`${API_URL}/notificaciones/${notif.id}/leer`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${session.accessToken}`,
                },
              });
            }
          });
        }
      } catch (error) {
        console.error('Error verificando operador asignado:', error);
      }
    };

    // Verificar cada 10 segundos si hay operador asignado
    const interval = setInterval(verificarOperadorAsignado, 10000);
    verificarOperadorAsignado(); // Verificar inmediatamente

    return () => clearInterval(interval);
  }, [session]);

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

  // Función para manejar el éxito del formulario
  const handleSuccessSolicitud = () => {
    setMessage('Solicitud creada exitosamente');
    setTabValue(1);
    // Recargar estadísticas después de crear una nueva solicitud
    cargarEstadisticas();
  };

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Tabs responsive
  const tabLabels = isSmallMobile 
    ? ['Nueva', 'Solicitudes', 'Documentos']
    : ['Nueva solicitud', 'Mis solicitudes', 'Plantilla de documentos'];

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Box>
                <Typography 
                  variant="h1" 
                  className="page-title"
                  sx={{ 
                    fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
                    fontWeight: 600 
                  }}
                >
                  Dashboard Solicitante PYME
                </Typography>
                <Typography 
                  variant="subtitle1" 
                  className="page-subtitle"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  Bienvenido {session?.user?.name || 'Usuario'}, gestión de solicitudes de crédito
                </Typography>
              </Box>
            </Box>
            
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
          
          <Alert severity="info" sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Complete su solicitud de crédito y suba toda la documentación requerida para agilizar el proceso.
          </Alert>

          {/* Tarjetas de Métricas - CORREGIDO: Layout compacto sin espacios grandes */}
          {loading ? (
            <Box sx={{ mb: 4 }}>
              <LinearProgress />
            </Box>
          ) : (
            // En la parte de las tarjetas de métricas, reemplazar con:
<Box 
  sx={{ 
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'row' },
    gap: 2,
    mb: 4,
    width: '100%',
    justifyContent: { sm: 'space-between' }
  }}
>
  {/* Primera tarjeta - Total solicitado */}
  <Box sx={{ 
    flex: { xs: '1 1 100%', sm: 1 },
    minWidth: { xs: '100%', sm: '30%' }
  }}>
    <SummaryCard
      title="Total solicitado"
      amount={formatCurrency(stats.totalSolicitado)}
      subtitle={`Solicitudes activas: ${stats.solicitudesActivas}`}
      icon={<DescriptionIcon />}
    />
  </Box>

  {/* Segunda tarjeta - Créditos aprobados */}
  <Box sx={{ 
    flex: { xs: '1 1 100%', sm: 1 },
    minWidth: { xs: '100%', sm: '30%' }
  }}>
    <SummaryCard
      title="Créditos aprobados"
      amount={stats.totalAprobadas.toString()}
      subtitle="Total de solicitudes aprobadas"
      icon={<CheckCircleIcon />}
      color="#28a745"
    />
  </Box>

  {/* Tercera tarjeta - En revisión */}
  <Box sx={{ 
    flex: { xs: '1 1 100%', sm: 1 },
    minWidth: { xs: '100%', sm: '30%' }
  }}>
    <SummaryCard
      title="En revisión"
      amount={stats.enRevision.toString()}
      subtitle="Respuesta en 24h"
      icon={<ScheduleIcon />}
      color="#ffc107"
    />
  </Box>
</Box>
          )}
          {/* Tabs Principal */}
          <Card className="content-box">
            <Box sx={{ borderBottom: 1, borderColor: 'divider', overflow: 'auto' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                variant={isSmallMobile ? "scrollable" : "standard"}
                scrollButtons={isSmallMobile ? "auto" : false}
                allowScrollButtonsMobile
              >
                {tabLabels.map((label, index) => (
                  <Tab 
                    key={index}
                    label={label}
                    sx={{ 
                      minWidth: { xs: 'auto', sm: 160 },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      px: { xs: 1, sm: 2 }
                    }}
                  />
                ))}
              </Tabs>
            </Box>

            {/* Contenido de Tabs */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ mt: 2 }}>
                <Typography 
                  variant="h5" 
                  gutterBottom
                  sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                >
                  Nueva solicitud de crédito
                </Typography>
                <SolicitudCreditoForm onSuccess={handleSuccessSolicitud} />
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box sx={{ mt: 2 }}>
                <ListaSolicitudes onUpdate={cargarEstadisticas} />
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Box sx={{ mt: 2 }}>
                <Typography 
                  variant="h5" 
                  gutterBottom
                  sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                >
                  Plantilla de Documentos
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  gutterBottom 
                  sx={{ 
                    mb: 2,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
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