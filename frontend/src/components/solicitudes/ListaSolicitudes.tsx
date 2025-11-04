// frontend/src/components/solicitudes/ListaSolicitudes.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { getSession } from 'next-auth/react';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Alert,
  Grid,
  Backdrop,
  CircularProgress
} from '@mui/material';

interface Solicitud {
  id: string;
  numero_solicitud: string;
  monto: number;
  plazo_meses: number;
  moneda: string;
  estado: string;
  nivel_riesgo?: string;
  created_at: string;
  fecha_envio?: string;
}

interface ListaSolicitudesProps {
  onUpdate: () => Promise<void>;
}

export default function ListaSolicitudes({ onUpdate }: ListaSolicitudesProps) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState('');
  const [solicitudCargando, setSolicitudCargando] = useState<string | null>(null);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const session = await getSession();

      if (!session?.accessToken) throw new Error('No estás autenticado');
      
      const response = await fetch(`${API_URL}/solicitudes/mis-solicitudes`, {
        method: 'GET', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron obtener las solicitudes.`);
      }

      const responseData = await response.json();
      setSolicitudes(responseData.data || []);
    } catch (error: any) {
      console.error('Error al cargar las solicitudes:', error);
      setError('Ocurrió un problema al cargar tus solicitudes.');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el clic en "Ver Detalles"
  const handleVerDetalles = async (solicitud: Solicitud) => {
    try {
      // Mostrar overlay de carga
      setSolicitudCargando(solicitud.id);
      setOverlayMessage(`Cargando detalles de ${solicitud.numero_solicitud}...`);
      setShowOverlay(true);

      // Simular un pequeño delay para mostrar el overlay (opcional)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verificar sesión antes de redirigir
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No estás autenticado');
      }

      // Actualizar mensaje antes de redirigir
      setOverlayMessage('Redirigiendo a detalles de la solicitud...');

      // Pequeño delay para que el usuario vea el mensaje
      await new Promise(resolve => setTimeout(resolve, 300));

      // Redirigir a la página de detalles
      window.location.href = `/solicitante/solicitudes/${solicitud.id}`;

    } catch (error: any) {
      console.error('Error al cargar detalles:', error);
      
      // Ocultar overlay en caso de error
      setShowOverlay(false);
      setSolicitudCargando(null);
      
      // Mostrar error al usuario
      setError(`Error al cargar detalles: ${error.message}`);
      
      // Auto-ocultar el error después de 5 segundos
      setTimeout(() => setError(''), 5000);
    }
  };

  // Función para cancelar la carga
  const handleCancelarCarga = () => {
    setShowOverlay(false);
    setSolicitudCargando(null);
    setOverlayMessage('');
  };

  const getEstadoColor = (estado: string) => {
    const colores: { [key: string]: any } = {
      'borrador': 'default',
      'enviado': 'primary',
      'en_revision': 'warning',
      'aprobado': 'success',
      'rechazado': 'error',
      'pendiente_info': 'info'
    };
    return colores[estado] || 'default';
  };

  const getNivelRiesgoColor = (nivel?: string) => {
    const colores: { [key: string]: any } = {
      'bajo': 'success',
      'medio': 'warning',
      'alto': 'error'
    };
    return nivel ? colores[nivel] : 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando solicitudes...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={cargarSolicitudes}>
            Reintentar
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (solicitudes.length === 0) {
    return (
      <Alert severity="info">
        No tiene solicitudes de crédito. Cree una nueva solicitud para comenzar.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Overlay de carga para "Ver Detalles" */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }}
        open={showOverlay}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 3,
            textAlign: 'center'
          }}
        >
          <CircularProgress color="inherit" size={60} />
          
          <Box>
            <Typography variant="h6" gutterBottom>
              {overlayMessage}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, maxWidth: 400 }}>
              Estamos preparando los detalles de tu solicitud. Esto puede tomar unos segundos...
            </Typography>
          </Box>

          <Button 
            variant="outlined" 
            color="inherit"
            onClick={handleCancelarCarga}
            sx={{ mt: 2 }}
          >
            Cancelar
          </Button>
        </Box>
      </Backdrop>

      <Typography variant="h6" gutterBottom>
        Mis solicitudes de crédito ({solicitudes.length})
      </Typography>
      
      <Grid container spacing={2}>
        {solicitudes.map((solicitud) => (
          <Grid size={{ xs: 12 }} key={solicitud.id}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" component="h2">
                      {solicitud.numero_solicitud}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Creada: {new Date(solicitud.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label={solicitud.estado} 
                      color={getEstadoColor(solicitud.estado)}
                      size="small"
                    />
                    {solicitud.nivel_riesgo && (
                      <Chip 
                        label={`Riesgo: ${solicitud.nivel_riesgo}`} 
                        color={getNivelRiesgoColor(solicitud.nivel_riesgo)}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="subtitle2">Monto</Typography>
                    <Typography variant="body1">
                      ${solicitud.monto.toLocaleString()} {solicitud.moneda}
                    </Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="subtitle2">Plazo</Typography>
                    <Typography variant="body1">
                      {solicitud.plazo_meses} meses
                    </Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="subtitle2">Estado</Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {solicitud.estado.replace('_', ' ')}
                    </Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => handleVerDetalles(solicitud)}
                      disabled={showOverlay && solicitudCargando === solicitud.id}
                      startIcon={
                        showOverlay && solicitudCargando === solicitud.id ? 
                        <CircularProgress size={16} /> : undefined
                      }
                    >
                      {showOverlay && solicitudCargando === solicitud.id ? 'Cargando...' : 'Ver Detalles'}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}