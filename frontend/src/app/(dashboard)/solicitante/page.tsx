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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { UserRole } from '@/types/auth.types';
import SolicitudCreditoForm from '@/components/solicitudes/SolicitudCreditoForm';
import ListaSolicitudes from '@/components/solicitudes/ListaSolicitudes';
import GestionDocumentos from '@/components/documentos/GestionDocumentos';
import DesactivarCuentaModal from '@/components/usuario/DesactivarCuentaModal';
import EmailRecuperacionForm from '@/components/usuario/EmailRecuperacionForm';

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

export default function DashboardSolicitante() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [solicitudActiva, setSolicitudActiva] = useState<string | null>(null);
  const [modalDesactivarOpen, setModalDesactivarOpen] = useState(false);
  const [modalConfigOpen, setModalConfigOpen] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    if (session?.user?.rol !== UserRole.SOLICITANTE) {
      router.push('/operador');
    }
  }, [status, session, router]);

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
          // Tomar la primera solicitud en estado borrador o enviado
          const solicitud = result.data?.find((s: any) => 
            s.estado === 'borrador' || s.estado === 'enviado'
          );
          if (solicitud) {
            setSolicitudActiva(solicitud.id);
          }
        }
      } catch (error) {
        console.error('Error cargando solicitud activa:', error);
      }
    };

    if (session) {
      cargarSolicitudActiva();
    }
  }, [session]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
const handleDesactivarCuenta = async (password: string, motivo?: string) => {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const session = await getSession();
    
    if (!session?.accessToken) {
      throw new Error('No estás autenticado');
    }

    const response = await fetch(`${API_URL}/usuario/desactivar-cuenta`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({ password, motivo }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    setMessage('Cuenta desactivada exitosamente. Serás redirigido...');
    
    // FORZAR CIERRE DE SESIÓN COMPLETO
    try {
      // 1. Limpiar localStorage
      if (session?.user?.id) {
        const userId = session.user.id;
        localStorage.removeItem(`solicitud_borrador_${userId}`);
        
        // Limpiar todos los borradores
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes(`solicitud_borrador_`)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      // 2. Cerrar sesión en NextAuth
      await signOut({ 
        callbackUrl: '/login?message=cuenta_desactivada',
        redirect: true 
      });

      // 3. Forzar recarga para limpiar estado
      setTimeout(() => {
        window.location.href = '/login?message=cuenta_desactivada';
      }, 1000);

    } catch (logoutError) {
      console.error('Error durante logout:', logoutError);
      // Fallback: redirigir directamente
      window.location.href = '/login?message=cuenta_desactivada';
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error al desactivar la cuenta');
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
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            Dashboard Solicitante PYME
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Bienvenido, {session?.user?.name || 'Usuario'}
          </Typography>
          <Chip 
            label="Solicitante" 
            color="primary" 
            variant="outlined" 
            sx={{ mt: 1 }}
          />
        </Box>

        {/* Botones de acción en el header */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => setModalConfigOpen(true)}
          >
            Configuración
          </Button>
          <Button 
            variant="outlined" 
            color="error"
            onClick={handleLogout}
          >
            Cerrar Sesión
          </Button>
        </Box>
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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Nueva Solicitud" />
          <Tab label="Mis Solicitudes" />
          <Tab label="Documentos" />
        </Tabs>
      </Box>

      {/* Contenido de Tabs */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Nueva Solicitud de Crédito
            </Typography>
            <SolicitudCreditoForm />
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ListaSolicitudes />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Gestión de Documentos
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Aquí podrá gestionar todos sus documentos subidos al sistema.
            </Typography>
            
            {solicitudActiva ? (
              <GestionDocumentos solicitudId={solicitudActiva} />
            ) : (
              <Alert severity="info">
                No hay una solicitud activa. Cree una nueva solicitud para comenzar a subir documentos.
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Modal de Configuración */}
      <Dialog 
        open={modalConfigOpen} 
        onClose={() => setModalConfigOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" component="div">
            Configuración de Cuenta
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Email de Recuperación */}
            <EmailRecuperacionForm />
            
            {/* Separador */}
            <Box sx={{ my: 4, borderBottom: 1, borderColor: 'divider' }} />
            
            {/* Desactivar Cuenta */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="error">
                  Zona de Peligro
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Una vez que desactives tu cuenta, no podrás acceder al sistema hasta que la reactives.
                </Typography>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setModalConfigOpen(false);
                    setModalDesactivarOpen(true);
                  }}
                  sx={{ mt: 2 }}
                >
                  Desactivar Mi Cuenta
                </Button>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalConfigOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Desactivar Cuenta */}
      <DesactivarCuentaModal
        open={modalDesactivarOpen}
        onClose={() => setModalDesactivarOpen(false)}
        onConfirm={handleDesactivarCuenta}
      />
    </Box>
  );
}