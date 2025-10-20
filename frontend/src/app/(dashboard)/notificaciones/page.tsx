'use client';
import { useRouter } from 'next/navigation';

import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Container
} from '@mui/material';
import { CheckCircle, MarkEmailRead } from '@mui/icons-material';
import { Notificacion } from '@/services/notificaciones.service';
import notificacionesService from '@/services/notificaciones.service';

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(true);
  const router = useRouter();

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  const cargarNotificaciones = async (paginaActual: number = 1) => {
    try {
      setCargando(true);
      const limit = 10;
      const offset = (paginaActual - 1) * limit;
      
      const response = await notificacionesService.obtenerNotificaciones(limit, offset);
      if (paginaActual === 1) {
        setNotificaciones(response.data);
      } else {
        setNotificaciones(prev => [...prev, ...response.data]);
      }
      
      setHayMas(response.data.length === limit);
      setPagina(paginaActual);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  const marcarComoLeida = async (id: string) => {
    try {
      await notificacionesService.marcarComoLeida(id);
      setNotificaciones(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, leida: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      await notificacionesService.marcarTodasComoLeidas();
      setNotificaciones(prev => 
        prev.map(notif => ({ ...notif, leida: true }))
      );
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerColorTipo = (tipo: string) => {
    const colores: { [key: string]: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" } = {
      cambio_estado: 'primary',
      nueva_solicitud: 'success',
      documento_validado: 'info',
      informacion_solicitada: 'warning',
      sistema: 'default',
    };
    return colores[tipo] || 'default';
  };

  const obtenerIconoTipo = (tipo: string) => {
    const iconos: { [key: string]: JSX.Element } = {
      cambio_estado: <Box component="span">🔄</Box>,
      nueva_solicitud: <Box component="span">.</Box>,
      documento_validado: <Box component="span">.</Box>,
      informacion_solicitada: <Box component="span">❓</Box>,
      sistema: <Box component="span">ℹ️</Box>,
    };
    return iconos[tipo] || <Box component="span">📢</Box>;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Notificaciones
          </Typography>

          <Button 
            variant="outlined" 
            onClick={marcarTodasComoLeidas}
            startIcon={<MarkEmailRead />}
          >
            Marcar todas como leídas
          </Button>
        </Box>

        <Card>
          <CardHeader title="Historial de Notificaciones" />
          <CardContent>
            {cargando && notificaciones.length === 0 ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : notificaciones.length === 0 ? (
              <Box textAlign="center" py={4} color="text.secondary">
                <Typography variant="h4" gutterBottom>📭</Typography>
                <Typography variant="body1">No tienes notificaciones</Typography>
              </Box>
            ) : (
              <Box sx={{ spaceY: 3 }}>
                {notificaciones.map((notificacion) => (
                  <Card
                    key={notificacion.id}
                    variant="outlined"
                    sx={{
                      mb: 2,
                      p: 2,
                      backgroundColor: notificacion.leida ? 'background.paper' : 'primary.light',
                      borderColor: notificacion.leida ? 'divider' : 'primary.main'
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box display="flex" alignItems="center" gap={2}>
                        {obtenerIconoTipo(notificacion.tipo)}
                        <Box>
                          <Chip
                            label={notificacion.tipo.replace('_', ' ')}
                            color={obtenerColorTipo(notificacion.tipo)}
                            size="small"
                          />
                          {!notificacion.leida && (
                            <Chip
                              label="Nuevo"
                              color="primary"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Box display="flex" gap={1}>
                        {!notificacion.leida && (
                          <IconButton
                            size="small"
                            onClick={() => marcarComoLeida(notificacion.id)}
                            color="primary"
                          >
                            <CheckCircle />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                    
                    <Typography variant="h6" gutterBottom>
                      {notificacion.titulo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {notificacion.mensaje}
                    </Typography>
                    
                    {notificacion.datos_adicionales && (
                      <Box 
                        bgcolor="grey.100" 
                        p={2} 
                        borderRadius={1} 
                        sx={{ spaceY: 1 }}
                      >
                        {notificacion.datos_adicionales.solicitud_numero && (
                          <Typography variant="body2">
                            <strong>Solicitud:</strong>{' '}
                            {notificacion.datos_adicionales.solicitud_numero}
                          </Typography>
                        )}
                        {notificacion.datos_adicionales.monto && (
                          <Typography variant="body2">
                            <strong>Monto:</strong> $
                            {notificacion.datos_adicionales.monto.toLocaleString()}
                          </Typography>
                        )}
                        {notificacion.datos_adicionales.estado_anterior && (
                          <Typography variant="body2">
                            <strong>Cambio de estado:</strong>{' '}
                            {notificacion.datos_adicionales.estado_anterior} →{' '}
                            {notificacion.datos_adicionales.estado_nuevo}
                          </Typography>
                        )}
                      </Box>
                    )}
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                      <Typography variant="caption" color="text.secondary">
                        {formatearFecha(notificacion.created_at)}
                      </Typography>
                      {notificacion.solicitud_id && (
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => {
                            window.location.href = `/solicitante/solicitudes/${notificacion.solicitud_id}`;
                          }}
                        >
                          Ver solicitud
                        </Button>
                      )}
                    </Box>
                  </Card>
                ))}
                
                {hayMas && (
                  <Box display="flex" justifyContent="center" pt={2}>
                    <Button
                      onClick={() => cargarNotificaciones(pagina + 1)}
                      disabled={cargando}
                      variant="outlined"
                    >
                      {cargando ? 'Cargando...' : 'Cargar más'}
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}