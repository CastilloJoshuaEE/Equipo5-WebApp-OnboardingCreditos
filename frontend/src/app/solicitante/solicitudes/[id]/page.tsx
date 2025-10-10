// frontend/src/app/solicitante/solicitudes/[id]/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Alert,
  Grid, Button, CircularProgress
} from '@mui/material';
import { getSession } from 'next-auth/react';

interface SolicitudDetalle {
  id: string;
  numero_solicitud: string;
  monto: number;
  plazo_meses: number;
  moneda: string;
  estado: string;
  nivel_riesgo: string;
  proposito: string;
  created_at: string;
  documentos: Array<{
    id: string;
    tipo: string;
    nombre_archivo: string;
    estado: string;
    created_at: string;
  }>;
}

export default function DetalleSolicitud() {
  const router = useRouter();
  const params = useParams();
  const [solicitud, setSolicitud] = useState<SolicitudDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const solicitudId = params?.id as string;

  useEffect(() => {
    cargarDetalleSolicitud();
  }, [solicitudId]);

  const cargarDetalleSolicitud = async () => {
    try {  
      const session = await getSession();

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/solicitudes/${solicitudId}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Error al cargar detalle');
      
      const result = await response.json();
      setSolicitud(result.data);
    } catch (error) {
      setError('No se pudo cargar el detalle de la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!solicitud) return <Alert severity="warning">Solicitud no encontrada</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Detalle de Solicitud: {solicitud.numero_solicitud}
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2">Monto</Typography>
              <Typography variant="h6">${solicitud.monto} {solicitud.moneda}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2">Plazo</Typography>
              <Typography variant="h6">{solicitud.plazo_meses} meses</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2">Estado</Typography>
              <Chip label={solicitud.estado} color="primary" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2">Nivel de Riesgo</Typography>
              <Chip label={solicitud.nivel_riesgo} variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2">Propósito</Typography>
              <Typography>{solicitud.proposito}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Button variant="outlined" onClick={() => router.push('/solicitante')}>
        Volver al Dashboard
      </Button>
    </Box>
  );
}