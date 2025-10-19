'use client';

import React, { useEffect, useState } from 'react';
import { Badge, IconButton } from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { NotificacionesModal } from './NotificacionesModal';
import notificacionesService from '@/services/notificaciones.service';
import { getSession } from 'next-auth/react';
export function NotificacionesBell() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [contadorNoLeidas, setContadorNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarContadorNotificaciones();
    
    const intervalo = setInterval(cargarContadorNotificaciones, 30000);
    
    return () => clearInterval(intervalo);
  }, []);

  const cargarContadorNotificaciones = async () => {
    try {
      const response = await notificacionesService.obtenerContadorNoLeidas();
      setContadorNoLeidas(response.data.count);
    } catch (error) {
      console.error('Error cargando contador de notificaciones:', error);
    }
  };

  const abrirModal = () => {
    setModalAbierto(true);
    cargarContadorNotificaciones();
  };

  const verTodasLasNotificaciones = () => {
    setModalAbierto(false);
    window.location.href = '/notificaciones';
  };

  return (
    <>
      <IconButton
        onClick={abrirModal}
        disabled={cargando}
        color="inherit"
      >
        <Badge 
          badgeContent={contadorNoLeidas > 9 ? '9+' : contadorNoLeidas} 
          color="error"
        >
          <Notifications />
        </Badge>
      </IconButton>

      <NotificacionesModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onVerTodas={verTodasLasNotificaciones}
      />
    </>
  );
}