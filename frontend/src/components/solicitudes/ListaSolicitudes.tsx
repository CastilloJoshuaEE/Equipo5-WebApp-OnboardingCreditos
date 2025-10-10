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
  Grid
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

export default function ListaSolicitudes() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    return <Typography>Cargando solicitudes...</Typography>;
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
      <Typography variant="h6" gutterBottom>
        Mis Solicitudes de Crédito ({solicitudes.length})
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
                      onClick={() => window.location.href = `/solicitante/solicitudes/${solicitud.id}`}
                    >
                      Ver Detalles
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