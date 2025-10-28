// frontend/src/app/solicitante/solicitudes/[id]/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  Divider,
  Paper
} from '@mui/material';
import { getSession } from 'next-auth/react';
import GestionDocumentos from '@/components/documentos/GestionDocumentos';
import BotonIniciarFirma from '@/components/BotonIniciarFirma';
interface SolicitudDetalle {
  id: string;
  numero_solicitud: string;
  monto: number;
  plazo_meses: number;
  moneda: string;
  estado: string;
  nivel_riesgo: string;
  proposito: string;
  comentarios?: string;
  motivo_rechazo?: string;
  created_at: string;
  fecha_envio?: string;
  fecha_decision?: string;
  documentos: Array<{
    id: string;
    tipo: string;
    nombre_archivo: string;
    estado: string;
    created_at: string;
    validado_en?: string;
    comentarios?: string;
  }>;
}

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
  const { data: session } = useSession();
  const [solicitud, setSolicitud] = useState<SolicitudDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const solicitudId = params?.id as string;

  useEffect(() => {
    if (solicitudId) {
      cargarDetalleSolicitud();
    }
  }, [solicitudId]);

  useEffect(() => {
    if (solicitud?.estado) {
      const stepIndex = estadosSolicitud.indexOf(solicitud.estado);
      setActiveStep(stepIndex >= 0 ? stepIndex : 0);
    }
  }, [solicitud]);

  const cargarDetalleSolicitud = async () => {
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
    } catch (error: any) {
      console.error('Error cargando detalle:', error);
      setError(error.message || 'No se pudo cargar el detalle de la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    const colores: { [key: string]: any } = {
      'borrador': 'default',
      'enviado': 'primary',
      'en_revision': 'warning',
      'pendiente_info': 'info',
      'aprobado': 'success',
      'rechazado': 'error'
    };
    return colores[estado] || 'default';
  };

  const getNivelRiesgoColor = (nivel: string) => {
    const colores: { [key: string]: any } = {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando detalle de solicitud...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={cargarDetalleSolicitud}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/solicitante')}
          sx={{ mt: 2 }}
        >
          Volver al Dashboard
        </Button>
    <BotonIniciarFirma 
      solicitudId={solicitudId} 
      onFirmaIniciada={(data) => {
        console.log('Firma digital iniciada:', data);
        // Aquí podrías recargar la solicitud si quieres actualizar el estado
        cargarDetalleSolicitud();
      }} 
    />
      </Box>
    );
  }

  if (!solicitud) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Solicitud no encontrada
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/solicitante')}
          sx={{ mt: 2 }}
        >
          Volver al Dashboard
        </Button>
    <BotonIniciarFirma 
      solicitudId={solicitudId} 
      onFirmaIniciada={(data) => {
        console.log('Firma digital iniciada:', data);
        // Aquí podrías recargar la solicitud si quieres actualizar el estado
        cargarDetalleSolicitud();
      }} 
    />

      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Detalle de Solicitud
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {solicitud.numero_solicitud}
        </Typography>
      </Box>

      {/* Stepper de Estado */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Estado de la Solicitud
          </Typography>
          <Stepper activeStep={activeStep} alternativeLabel>
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
              <StepLabel>Pendiente Info</StepLabel>
            </Step>
            <Step>
              <StepLabel>Decisión</StepLabel>
            </Step>
          </Stepper>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={solicitud.estado} 
              color={getEstadoColor(solicitud.estado)}
              size="medium"
            />
            {solicitud.nivel_riesgo && (
              <Chip 
                label={`Riesgo: ${solicitud.nivel_riesgo}`} 
                color={getNivelRiesgoColor(solicitud.nivel_riesgo)}
                size="medium"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Información Principal */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Datos del Crédito */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Datos del Crédito
              </Typography>
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
            </CardContent>
          </Card>

          {/* Gestión de Documentos */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Documentos de la Solicitud
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Gestione todos los documentos asociados a esta solicitud
              </Typography>
              
              <GestionDocumentos solicitudId={solicitudId} />
            </CardContent>
          </Card>
        </Grid>

        {/* Panel Lateral */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Información de Fechas */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información de Fechas
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Fecha de Creación
                </Typography>
                <Typography variant="body2">
                  {formatDate(solicitud.created_at)}
                </Typography>
              </Box>

              {solicitud.fecha_envio && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de Envío
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(solicitud.fecha_envio)}
                  </Typography>
                </Box>
              )}

              {solicitud.fecha_decision && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de Decisión
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(solicitud.fecha_decision)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Comentarios y Observaciones */}
          {(solicitud.comentarios || solicitud.motivo_rechazo) && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {solicitud.motivo_rechazo ? 'Motivo de Rechazo' : 'Comentarios'}
                </Typography>
                <Alert 
                  severity={solicitud.motivo_rechazo ? 'error' : 'info'}
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
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Acciones
              </Typography>
              
              <Button 
                variant="outlined" 
                fullWidth
                onClick={() => router.push('/solicitante')}
                sx={{ mb: 1 }}
              >
                Volver al Dashboard
              </Button>
    <BotonIniciarFirma 
      solicitudId={solicitudId} 
      onFirmaIniciada={(data) => {
        console.log('Firma digital iniciada:', data);
        // Aquí podrías recargar la solicitud si quieres actualizar el estado
        cargarDetalleSolicitud();
      }} 
    />
              {solicitud.estado === 'borrador' && (
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => {
                    // Aquí podrías implementar la funcionalidad para continuar editando
                    alert('Funcionalidad para continuar edición en desarrollo');
                  }}
                >
                  Continuar Edición
                </Button>
              )}

              {solicitud.estado === 'pendiente_info' && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    Se requiere información adicional. Revise los comentarios del operador.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Resumen de Documentos */}
      {solicitud.documentos && solicitud.documentos.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Resumen de Documentos ({solicitud.documentos.length})
            </Typography>
            <Grid container spacing={2}>
              {solicitud.documentos.map((documento) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={documento.id}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          {documento.tipo.toUpperCase()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {documento.nombre_archivo}
                        </Typography>
                      </Box>
                      <Chip 
                        label={documento.estado} 
                        color={getEstadoColor(documento.estado)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Subido: {formatDate(documento.created_at)}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}