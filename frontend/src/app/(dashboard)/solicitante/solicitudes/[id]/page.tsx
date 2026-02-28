// frontend/src/app/(dashboard)/solicitante/solicitudes/[id]/page.tsx
'use client';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  Alert,
  Grid, 
  Button, 
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { getSession } from 'next-auth/react';
import GestionDocumentos from '@/components/documentos/GestionDocumentos';
import BotonIniciarFirma from '@/components/BotonIniciarFirma';
import { SolicitudDetalle } from '@/features/solicitudes/solicitud.types';
import DeleteIcon from '@mui/icons-material/Delete';
import { useToast } from '@/components/ui/use-toast';
const estadosSolicitud = [
  'borrador',
  'enviado', 
  'en_revision',
  'pendiente_info',
  'aprobado',
  'rechazado'
];

export default function DetalleSolicitud() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [solicitud, setSolicitud] = useState<SolicitudDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const solicitudId = params?.id as string;

  useEffect(() => {
    if (solicitud?.estado) {
      const stepIndex = estadosSolicitud.indexOf(solicitud.estado);
      setActiveStep(stepIndex >= 0 ? stepIndex : 0);
    }
  }, [solicitud]);

  const cargarDetalleSolicitud = useCallback(async () => {
    try {
      setLoading(true);
      const session = await getSession();

      if (!session?.accessToken) {
        throw new Error('No estás autenticado');
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/solicitudes/${solicitudId}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Solicitud no encontrada');
        }
        throw new Error('Error al cargar el detalle de la solicitud');
      }
      
      const result = await response.json();
      setSolicitud(result.data);
    } catch (error: unknown) {
      console.error('Error cargando detalle:', error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('No se pudo cargar el detalle de la solicitud');
      }
    } finally {
      setLoading(false);
    }
  }, [solicitudId]);

  useEffect(() => {
    if (solicitudId) {
      cargarDetalleSolicitud();
    }
  }, [solicitudId, cargarDetalleSolicitud]);

  const getEstadoColor = (estado: string) => {
    const colores: Record<string, "default" | "primary" | "warning" | "info" | "success" | "error"> = {
      'borrador': 'default',
      'enviado': 'primary',
      'en_revision': 'warning',
      'pendiente_info': 'info',
      'aprobado': 'success',
      'rechazado': 'error'
    };
    return colores[estado] || 'default';
  };

const BotonEliminarSolicitud = ({ solicitudId, solicitudEstado, onEliminar }: { 
  solicitudId: string; 
  solicitudEstado: string;
  onEliminar: () => void;
}) => {
  const [dialogoEliminar, setDialogoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const { toast } = useToast();

  const handleEliminar = async () => {
    try {
      setEliminando(true);
      const session = await getSession();
      
      if (!session?.accessToken) {
        throw new Error('No estás autenticado');
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/solicitudes/${solicitudId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar la solicitud');
      }

      toast({
        title: 'Solicitud eliminada',
        description: 'La solicitud ha sido eliminada exitosamente',
        variant: 'default'
      });

      onEliminar(); // Redirigir o actualizar
      
    } catch (error) {
      console.error('Error eliminando solicitud:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo eliminar la solicitud',
        variant: 'destructive'
      });
    } finally {
      setEliminando(false);
      setDialogoEliminar(false);
    }
  };

  // Solo mostrar si está en borrador
  if (solicitudEstado !== 'borrador') return null;
  return (
  <Button
    variant="outlined"
    color="error"
    fullWidth
    startIcon={<DeleteIcon />}
    onClick={handleEliminar}
    disabled={eliminando}
    sx={{ mt: 1 }}
  >
    {eliminando ? 'Eliminando...' : 'Eliminar Solicitud'}
  </Button>
);

};
  const getNivelRiesgoColor = (nivel: string) => {
    const colores: Record<string, "default" | "primary" | "warning" | "info" | "success" | "error"> = {
      'bajo': 'success',
      'medio': 'warning',
      'alto': 'error'
    };
    return colores[nivel] || 'default';
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    if (isMobile) {
      // Formato más compacto para móviles
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight={isMobile ? "100vh" : "400px"}
        sx={{ p: isMobile ? 2 : 3 }}
      >
        <CircularProgress size={isMobile ? 40 : 60} />
        <Typography variant={isMobile ? "body2" : "body1"} sx={{ mt: 2, textAlign: 'center' }}>
          Cargando detalle de solicitud...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: isMobile ? 2 : 3 }}>
        <Alert 
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={cargarDetalleSolicitud}>
              Reintentar
            </Button>
          }
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>

      </Box>
    );
  }

  if (!solicitud) {
    return (
      <Box sx={{ p: isMobile ? 2 : 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Solicitud no encontrada
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/solicitante')}
          fullWidth={isMobile}
          startIcon={<ArrowBackIcon />}
        >
          Volver al Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        p: isMobile ? 1 : 3, 
        bgcolor: '#f5f5f5', 
        minHeight: '100vh',
        overflowX: 'hidden'
      }}
    >
      {/* Header con botón de retroceso para móviles */}
      <Box 
        sx={{ 
          mb: isMobile ? 2 : 4,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap'
        }}
      >
        {isMobile && (
          <IconButton onClick={() => router.push('/solicitante')} size="small">
            <ArrowBackIcon />
          </IconButton>
        )}
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1" 
            gutterBottom={!isMobile}
            color="primary"
            sx={{ fontSize: isMobile ? '1.5rem' : undefined }}
          >
            Detalle de Solicitud
          </Typography>
          <Typography 
            variant={isMobile ? "body2" : "h6"} 
            color="text.secondary"
          >
            {solicitud.numero_solicitud}
          </Typography>
        </Box>
      </Box>

      {/* Stepper de Estado - Versión simplificada para móviles */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1rem' : undefined }}>
            Estado de la Solicitud
          </Typography>
          
          {isMobile ? (
            // Versión compacta para móviles
            <Box sx={{ width: '100%', overflowX: 'auto', pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '300px' }}>
                {estadosSolicitud.slice(0, 4).map((estado, index) => (
                  <Box key={estado} sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Box 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%',
                          bgcolor: index <= activeStep ? 'primary.main' : 'grey.300',
                          mx: 'auto',
                          mb: 0.5
                        }} 
                      />
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        {estado === 'en_revision' ? 'Revisión' : 
                         estado === 'pendiente_info' ? 'Info' : 
                         estado.charAt(0).toUpperCase() + estado.slice(1, 3)}
                      </Typography>
                    </Box>
                    {index < 3 && (
                      <Box 
                        sx={{ 
                          flex: 0.5, 
                          height: 2, 
                          bgcolor: index < activeStep ? 'primary.main' : 'grey.300'
                        }} 
                      />
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Stepper activeStep={activeStep} alternativeLabel={isTablet}>
              <Step>
                <StepLabel>Borrador</StepLabel>
              </Step>
              <Step>
                <StepLabel>Enviado</StepLabel>
              </Step>
              <Step>
                <StepLabel>En Revisión</StepLabel>
              </Step>
              <Step>
                <StepLabel>Decisión</StepLabel>
              </Step>            
            </Stepper>
          )}
          
          <Box sx={{ 
            mt: 2, 
            display: 'flex', 
            gap: 1, 
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center'
          }}>
            <Chip 
              label={solicitud.estado} 
              color={getEstadoColor(solicitud.estado)}
              size={isMobile ? "small" : "medium"}
            />
            {solicitud.nivel_riesgo && (
              <Chip 
                label={`Riesgo: ${solicitud.nivel_riesgo}`} 
                color={getNivelRiesgoColor(solicitud.nivel_riesgo)}
                size={isMobile ? "small" : "medium"}
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={isMobile ? 2 : 3}>
        {/* Información Principal */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Datos del Crédito - Tarjeta compacta para móviles */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1rem' : undefined }}>
                Datos del Crédito
              </Typography>
              
              {isMobile ? (
                // Versión compacta para móviles
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MoneyIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Monto Solicitado
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(solicitud.monto, solicitud.moneda)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ScheduleIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Plazo
                      </Typography>
                      <Typography variant="body1">
                        {solicitud.plazo_meses} meses
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Propósito
                    </Typography>
                    <Typography variant="body2">
                      {solicitud.proposito}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Monto Solicitado
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {formatCurrency(solicitud.monto, solicitud.moneda)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Plazo
                    </Typography>
                    <Typography variant="h6">
                      {solicitud.plazo_meses} meses
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Propósito
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {solicitud.proposito}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Gestión de Documentos */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <DescriptionIcon color="primary" sx={{ fontSize: isMobile ? 20 : 24 }} />
                <Typography variant="h6" sx={{ fontSize: isMobile ? '1rem' : undefined }}>
                  Documentos de la Solicitud
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ ml: isMobile ? 4 : 0 }}>
                Gestione todos los documentos asociados a esta solicitud
              </Typography>
              
              <GestionDocumentos solicitudId={solicitudId} />
            </CardContent>
          </Card>
        </Grid>

        {/* Panel Lateral */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Información de Fechas */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1rem' : undefined }}>
                Información de Fechas
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                <CalendarIcon sx={{ color: 'text.secondary', fontSize: isMobile ? 18 : 20, mt: 0.3 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Fecha de Creación
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(solicitud.created_at)}
                  </Typography>
                </Box>
              </Box>

              {solicitud.fecha_envio && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                  <CalendarIcon sx={{ color: 'text.secondary', fontSize: isMobile ? 18 : 20, mt: 0.3 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Fecha de Envío
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(solicitud.fecha_envio)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {solicitud.fecha_decision && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <CalendarIcon sx={{ color: 'text.secondary', fontSize: isMobile ? 18 : 20, mt: 0.3 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Fecha de Decisión
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(solicitud.fecha_decision)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Comentarios y Observaciones */}
          {(solicitud.comentarios || solicitud.motivo_rechazo) && (
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1rem' : undefined }}>
                  {solicitud.motivo_rechazo ? 'Motivo de Rechazo' : 'Comentarios'}
                </Typography>
                <Alert 
                  severity={solicitud.motivo_rechazo ? 'error' : 'info'}
                  icon={solicitud.motivo_rechazo ? <WarningIcon /> : undefined}
                  sx={{ mt: 1 }}
                >
                  <Typography variant="body2">
                    {solicitud.motivo_rechazo || solicitud.comentarios}
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Acciones */}
          <Card>
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1rem' : undefined }}>
                Acciones
              </Typography>
              

 {/* Solo mostrar el botón de firma si la solicitud está APROBADA */}
    {solicitud.estado === 'aprobado' && (
      <BotonIniciarFirma 
        solicitudId={solicitudId} 
        onFirmaIniciada={(data) => {
          console.log('Firma digital iniciada:', data);
          cargarDetalleSolicitud();
        }} 
      />
    )}


              {solicitud.estado === 'borrador' && (
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => {
                    // Aquí podrías implementar la funcionalidad para continuar editando
                    alert('Funcionalidad para continuar edición en desarrollo');
                  }}
                  sx={{ mt: 1 }}
                >
                  Continuar Edición
                </Button>
              )}
{solicitud.estado === 'borrador' && (
  <BotonEliminarSolicitud 
    solicitudId={solicitudId}
    solicitudEstado={solicitud.estado}
    onEliminar={() => router.push('/solicitante')}
  />
)}
              {solicitud.estado === 'pendiente_info' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Se requiere información adicional. Revise los comentarios del operador.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}