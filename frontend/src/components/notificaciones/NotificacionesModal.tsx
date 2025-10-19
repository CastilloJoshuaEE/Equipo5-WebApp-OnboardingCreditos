'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  Box,
  Button,
  Typography,
  IconButton,
  Divider
} from '@mui/material';
import { Close, MarkEmailRead } from '@mui/icons-material';
import { Notificacion } from '@/services/notificaciones.service';
import notificacionesService from '@/services/notificaciones.service';
import { getSession } from 'next-auth/react';

interface NotificacionesModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onVerTodas: () => void;
}

export function NotificacionesModal({
  abierto,
  onCerrar,
  onVerTodas,
}: NotificacionesModalProps) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (abierto) {
      cargarNotificaciones();
    }
  }, [abierto]);

  const cargarNotificaciones = async () => {
    try {
      setCargando(true);
      const response = await notificacionesService.obtenerNoLeidas();
      setNotificaciones(response.data);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  const marcarComoLeida = async (id: string) => {
    try {
      await notificacionesService.marcarComoLeida(id);
      setNotificaciones(prev => prev.filter(notif => notif.id !== id));
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      await notificacionesService.marcarTodasComoLeidas();
      setNotificaciones([]);
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
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

  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Notificaciones Pendientes</Typography>
          {notificaciones.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              onClick={marcarTodasComoLeidas}
              startIcon={<MarkEmailRead />}
            >
              Marcar todas
            </Button>
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0 }}>
        {cargando ? (
          <Box display="flex" justifyContent="center" py={4}>
            <Typography>Cargando...</Typography>
          </Box>
        ) : notificaciones.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h4" gutterBottom>🎉</Typography>
            <Typography color="text.secondary">
              No tienes notificaciones pendientes
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {notificaciones.map((notificacion, index) => (
              <Box key={notificacion.id}>
                <Box p={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={notificacion.tipo.replace('_', ' ')}
                        color={obtenerColorTipo(notificacion.tipo)}
                        size="small"
                      />
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => marcarComoLeida(notificacion.id)}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    {notificacion.titulo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {notificacion.mensaje}
                  </Typography>
                  
                  {notificacion.datos_adicionales && (
                    <Box bgcolor="grey.50" p={1} borderRadius={1} mb={1}>
                      {notificacion.datos_adicionales.solicitud_numero && (
                        <Typography variant="caption" display="block">
                          Solicitud: {notificacion.datos_adicionales.solicitud_numero}
                        </Typography>
                      )}
                      {notificacion.datos_adicionales.estado_anterior && (
                        <Typography variant="caption" display="block">
                          Estado: {notificacion.datos_adicionales.estado_anterior} →{' '}
                          {notificacion.datos_adicionales.estado_nuevo}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {formatearFecha(notificacion.created_at)}
                    </Typography>
                    {notificacion.solicitud_id && (
                      <Button
                        variant="text"
                        size="small"
  onClick={() => marcarComoLeida(notificacion.id)}
                      >
                        Marcar como leída
                      </Button>
                    )}
                  </Box>
                </Box>
                {index < notificaciones.length - 1 && <Divider />}
              </Box>
            ))}
          </Box>
        )}
        
        <Box p={2} display="flex" justifyContent="space-between">
          <Button variant="outlined" onClick={onCerrar}>
            Cerrar
          </Button>
          <Button variant="contained" onClick={onVerTodas}>
            Ver todas
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}