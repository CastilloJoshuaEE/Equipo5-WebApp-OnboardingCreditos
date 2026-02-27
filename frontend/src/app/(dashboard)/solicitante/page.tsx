// frontend/src/app/(dashboard)/solicitante/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
  LinearProgress
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { UserRole } from '@/features/auth/auth.types';
import SolicitudCreditoForm from '@/components/solicitudes/SolicitudCreditoForm';
import ListaSolicitudes from '@/components/solicitudes/ListaSolicitudes';
import PlantillasDocumento from '@/components/solicitante/PlantillasDocumento';
import { useSessionExpired } from '@/providers/SessionExpiredProvider';
import { TabPanelProps } from '@/components/ui/tab';

/* ---------- TabPanel ---------- */
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
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>{children}</Box>
      )}
    </div>
  );
}

/* ---------- SummaryCard ---------- */
interface SummaryCardProps {
  title: string;
  amount: string;
  subtitle: string;
  icon: React.ReactNode;
  color?: string;
}

function SummaryCard({ title, amount, subtitle, icon, color }: SummaryCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        border: '1px solid #e9ecef',
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2, md: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              color: '#6c757d',
              fontWeight: 500,
              fontSize: { xs: '0.875rem', sm: '0.9rem', md: '1rem' },
              flex: 1,
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>
          <Box sx={{ color: '#A020F0', flexShrink: 0, ml: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            {icon}
          </Box>
        </Box>

        <Typography
          variant="h4"
          sx={{
            color: color ?? 'inherit',
            fontSize: { xs: '1.5rem', sm: '1.6rem', md: '1.8rem' },
            fontWeight: 700,
            my: 1,
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
          }}
        >
          {amount}
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: '#6c757d', fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' }, lineHeight: 1.4 }}
        >
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

/* ---------- Types ---------- */
interface SolicitudStats {
  totalSolicitado: number;
  totalAprobadas: number;
  enRevision: number;
  solicitudesActivas: number;
}
interface Solicitud {
  id: string;
  estado: string;
  monto?: number;
}

/* ---------- Page ---------- */
export default function DashboardSolicitante() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [tabValue, setTabValue] = useState(0);
  const [solicitudActiva, setSolicitudActiva] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState<SolicitudStats>({
    totalSolicitado: 0,
    totalAprobadas: 0,
    enRevision: 0,
    solicitudesActivas: 0,
  });
  const [loading, setLoading] = useState(true);
  const { showSessionExpired } = useSessionExpired();

  /* ----- Auth guard ----- */
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (session?.user?.rol && session.user.rol !== UserRole.SOLICITANTE) {
      router.push('/operador');
    }
  }, [status, session, router]);

  /* ----- Load stats ----- */
  const cargarEstadisticas = useCallback(async () => {
    try {
      setLoading(true);
      const session = await getSession();
      if (!session?.accessToken) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/solicitudes/mis-solicitudes`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (response.ok) {
        const result = await response.json();
        const solicitudes: Solicitud[] = result.data || [];

        const totalSolicitado = solicitudes
          .filter((s) => s.estado !== 'rechazado')
          .reduce((sum, s) => sum + (s.monto || 0), 0);

        const totalAprobadas = solicitudes.filter((s) => s.estado === 'aprobado').length;

        const enRevision = solicitudes.filter(
          (s) => s.estado === 'en_revision' || s.estado === 'pendiente_info' || s.estado === 'enviado'
        ).length;

        const solicitudesActivas = solicitudes.filter(
          (s) =>
            s.estado === 'borrador' ||
            s.estado === 'enviado' ||
            s.estado === 'en_revision' ||
            s.estado === 'pendiente_info'
        ).length;

        setStats({ totalSolicitado, totalAprobadas, enRevision, solicitudesActivas });

        const activa = solicitudes.find((s) => s.estado === 'borrador' || s.estado === 'enviado');
        if (activa) setSolicitudActiva(activa.id);
      } else if (response.status === 401) {
        showSessionExpired();
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  }, [showSessionExpired]);

  /* ----- Token expiry check ----- */
  useEffect(() => {
    const checkTokenExpiry = () => {
      if (session?.accessToken) {
        try {
          const payload = JSON.parse(atob(session.accessToken.split('.')[1]));
          if (Date.now() >= payload.exp * 1000) showSessionExpired();
        } catch (error) {
          console.error('Error verificando token:', error);
        }
      }
    };
    const interval = setInterval(checkTokenExpiry, 30000);
    checkTokenExpiry();
    return () => clearInterval(interval);
  }, [session, showSessionExpired]);

  /* ----- Load stats on session ----- */
  useEffect(() => {
    if (session) cargarEstadisticas();
  }, [session, cargarEstadisticas]);

  /* ----- Operador asignado notifications ----- */
  useEffect(() => {
    const verificarOperadorAsignado = async () => {
      try {
        const session = await getSession();
        if (!session?.accessToken) return;

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(
          `${API_URL}/notificaciones?leida=false&tipo=operador_asignado`,
          { headers: { Authorization: `Bearer ${session.accessToken}` } }
        );

        if (response.ok) {
          const result = await response.json();
          const notifs: { id: string; datos_adicionales?: { operador_nombre?: string } }[] =
            result.data || [];

          notifs.forEach((notif) => {
            if (notif.datos_adicionales?.operador_nombre) {
              alert(
                `Se ha asignado el operador ${notif.datos_adicionales.operador_nombre} a tu solicitud. \n\nPuedes comunicarte con él para cualquier consulta sobre tu solicitud de crédito.`
              );
              fetch(`${API_URL}/notificaciones/${notif.id}/leer`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${session.accessToken}` },
              });
            }
          });
        }
      } catch (error) {
        console.error('Error verificando operador asignado:', error);
      }
    };

    const interval = setInterval(verificarOperadorAsignado, 10000);
    verificarOperadorAsignado();
    return () => clearInterval(interval);
  }, [session]);

  /* ----- Helpers ----- */
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => setTabValue(newValue);

  const handleSuccessSolicitud = () => {
    setMessage('Solicitud creada exitosamente');
    setTabValue(1);
    cargarEstadisticas();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const tabLabels = isSmallMobile
    ? ['Nueva', 'Solicitudes', 'Documentos']
    : ['Nueva solicitud', 'Mis solicitudes', 'Plantilla de documentos'];

  /* ----- Loading state ----- */
  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
      </Box>
    );
  }

  /* ----- Render ----- */
  return (
    /*
     * KEY FIX: This Box is the direct child rendered inside the (dashboard) layout slot.
     * It must NOT add its own left margin/padding — the parent layout already offsets
     * content past the sidebar. width:100% + box-sizing:border-box fills exactly the
     * space given to it without creating a phantom gap.
     */
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        bgcolor: '#f8f9fa',
        boxSizing: 'border-box',
        m: 0,
        p: 0,
      }}
    >
      <Box
        component="main"
        sx={{
          width: '100%',
          p: { xs: 1, sm: 2, md: 3 },
          boxSizing: 'border-box',
        }}
      >
        {/* ── Header ── */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 2,
              mb: 1,
            }}
          >
            <Box>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
                  fontWeight: 600,
                  color: '#343a3a',
                  letterSpacing: '-0.01em',
                }}
              >
                Dashboard Solicitante PYME
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ color: '#6c757d', fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                Bienvenido {session?.user?.name || 'Usuario'}, gestión de solicitudes de crédito
              </Typography>
            </Box>
          </Box>

          <Chip label="Solicitante" color="primary" variant="outlined" sx={{ mt: 1 }} />
        </Box>

        {/* ── Alerts ── */}
        {message && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Complete su solicitud de crédito y suba toda la documentación requerida para agilizar el
          proceso.
        </Alert>

        {/* ── Metric cards ── */}
        {loading ? (
          <Box sx={{ mb: 3 }}>
            <LinearProgress />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 2,
              mb: 3,
              width: '100%',
            }}
          >
            <SummaryCard
              title="Total solicitado"
              amount={formatCurrency(stats.totalSolicitado)}
              subtitle={`Solicitudes activas: ${stats.solicitudesActivas}`}
              icon={<DescriptionIcon />}
            />
            <SummaryCard
              title="Créditos aprobados"
              amount={stats.totalAprobadas.toString()}
              subtitle="Total de solicitudes aprobadas"
              icon={<CheckCircleIcon />}
              color="#28a745"
            />
            <SummaryCard
              title="En revisión"
              amount={stats.enRevision.toString()}
              subtitle="Respuesta en 24h"
              icon={<ScheduleIcon />}
              color="#ffc107"
            />
          </Box>
        )}

        {/* ── Tabs card ── */}
        <Card
          sx={{
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef',
            overflow: 'hidden',
          }}
        >
          {/* Tab header */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', overflow: 'auto' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant={isSmallMobile ? 'scrollable' : 'standard'}
              scrollButtons={isSmallMobile ? 'auto' : false}
              allowScrollButtonsMobile
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  minWidth: { xs: 'auto', sm: 160 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 },
                },
                '& .MuiTab-root.Mui-selected': { color: '#A020F0', fontWeight: 600 },
                '& .MuiTabs-indicator': { backgroundColor: '#A020F0', height: 3 },
                '& .MuiTabs-scrollable': {
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' },
                },
              }}
            >
              {tabLabels.map((label, i) => (
                <Tab key={i} label={label} />
              ))}
            </Tabs>
          </Box>

          {/* Tab: Nueva solicitud */}
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

          {/* Tab: Mis solicitudes */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mt: 2 }}>
              <ListaSolicitudes onUpdate={cargarEstadisticas} />
            </Box>
          </TabPanel>

          {/* Tab: Plantillas */}
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
                sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                Aquí podrás ver y descargar los archivos Word de ejemplo disponibles. Recuerde subir
                los archivos en formato PDF.
              </Typography>
              <PlantillasDocumento />
            </Box>
          </TabPanel>
        </Card>
      </Box>
    </Box>
  );
}