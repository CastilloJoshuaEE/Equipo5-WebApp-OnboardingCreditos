// frontend/src/components/solicitante/PlantillasDocumento.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
  Skeleton
} from '@mui/material';
import { 
  Download, 
  Description as DescriptionIcon,
  CalendarToday,
  Storage,
  Category
} from '@mui/icons-material';
import { Plantilla } from '@/features/documentos/documento.types';
import { useSession } from 'next-auth/react';

export default function GestionPlantillas() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { data: session, status } = useSession();
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  useEffect(() => {
    if (status === 'authenticated') {
      cargarPlantillas();
    } else if (status === 'unauthenticated') {
      setError('Debes iniciar sesión para ver las plantillas');
      setLoading(false);
    }
  }, [status]);

  const cargarPlantillas = async () => {
    try {
      setLoading(true);
      
      if (!session?.accessToken) {
        throw new Error('No hay token de autenticación');
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const res = await fetch(`${API_URL}/plantillas`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      
      if (json.success) {
        setPlantillas(json.data);
      } else {
        throw new Error(json.message || 'Error al cargar plantillas');
      }
    } catch (err) {
      console.error('Error cargando plantillas:', err);
      setError(err instanceof Error ? err.message : 'Error cargando plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleDescargar = async (plantilla: Plantilla) => {
    try {
      if (!session?.accessToken) {
        throw new Error('No hay token de autenticación');
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${API_URL}/plantillas/${plantilla.id}/descargar`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al descargar la plantilla');
      }

      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = plantilla.nombre_archivo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Plantilla descargada exitosamente');
      
    } catch (err) {
      console.error('Error descargando plantilla:', err);
      setError(err instanceof Error ? err.message : 'Error al descargar la plantilla');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info'> = {
      contrato: 'primary',
      autorizacion: 'secondary',
      carta: 'success',
      formulario: 'warning'
    };
    return colors[tipo] || 'info';
  };

  // Renderizado para móvil (cards)
  const renderMobileView = () => (
    <Grid container spacing={2}>
      {plantillas.map((p) => (
        <Grid size={{ xs: 12}}key={p.id}>
          <Card 
            variant="outlined"
            sx={{
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4]
              }
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <DescriptionIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="600" noWrap>
                  {p.nombre_archivo}
                </Typography>
              </Box>
              
              <Grid container spacing={1} sx={{ mt: 1 }}>
                <Grid size={{ xs: 6}}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Category fontSize="small" color="action" />
                    <Chip 
                      label={p.tipo} 
                      size="small" 
                      color={getTipoColor(p.tipo)}
                      variant="outlined"
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 6}}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Storage fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {formatFileSize(p.tamanio_bytes)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <CalendarToday fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(p.created_at??'')}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<Download />}
                onClick={() => handleDescargar(p)}
                fullWidth
                sx={{
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                Descargar
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Renderizado para tablet (cards más compactas)
  const renderTabletView = () => (
    <Grid container spacing={2}>
      {plantillas.map((p) => (
        <Grid size={{ xs: 12, sm: 6 }} key={p.id}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight="600" gutterBottom noWrap>
                {p.nombre_archivo}
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                <Chip 
                  label={p.tipo} 
                  size="small" 
                  color={getTipoColor(p.tipo)}
                  variant="outlined"
                />
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(p.tamanio_bytes)}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block">
                {formatDate(p.created_at??'')}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                startIcon={<Download />}
                onClick={() => handleDescargar(p)}
                fullWidth
              >
                Descargar
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Renderizado para escritorio (tabla)
  const renderDesktopView = () => (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Nombre</TableCell>
          <TableCell align="center">Tipo</TableCell>
          <TableCell align="right">Tamaño</TableCell>
          <TableCell align="center">Fecha</TableCell>
          <TableCell align="center">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {plantillas.map((p) => (
          <TableRow 
            key={p.id}
            sx={{
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <TableCell>
              <Box display="flex" alignItems="center" gap={1}>
                <DescriptionIcon color="primary" fontSize="small" />
                <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                  {p.nombre_archivo}
                </Typography>
              </Box>
            </TableCell>
            <TableCell align="center">
              <Chip 
                label={p.tipo} 
                size="small" 
                color={getTipoColor(p.tipo)}
                variant="outlined"
              />
            </TableCell>
            <TableCell align="right">
              {formatFileSize(p.tamanio_bytes)}
            </TableCell>
            <TableCell align="center">
              <Typography variant="body2" color="text.secondary">
                {formatDate(p.created_at?? '')}
              </Typography>
            </TableCell>
            <TableCell align="center">
              <Tooltip title="Descargar plantilla">
                <IconButton
                  color="primary"
                  onClick={() => handleDescargar(p)}
                  size="small"
                >
                  <Download />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  // Renderizado de skeletons durante carga
  const renderSkeletons = () => {
    if (isMobile) {
      return (
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid size={{ xs: 12}}key={i}>
              <Card variant="outlined">
                <CardContent>
                  <Skeleton variant="text" width="80%" height={24} />
                  <Skeleton variant="text" width="40%" height={20} />
                  <Skeleton variant="text" width="60%" height={20} />
                </CardContent>
                <CardActions>
                  <Skeleton variant="rectangular" width="100%" height={36} />
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }
    
    return (
      <Box>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          Plantillas de Documentos
        </Typography>
        {renderSkeletons()}
      </Box>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Debes iniciar sesión para ver y descargar las plantillas de documentos.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box 
        sx={{ 
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2
        }}
      >
        <Box>
          <Typography 
            variant={isMobile ? 'h6' : 'h5'} 
            gutterBottom={isMobile}
            sx={{ fontWeight: 600 }}
          >
            Plantillas de Documentos
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ maxWidth: 600 }}
          >
            Aquí puedes descargar las plantillas de documentos necesarias para tu solicitud de crédito.
          </Typography>
        </Box>
        
        <Chip 
          label={`${plantillas.length} plantillas disponibles`}
          color="primary"
          variant="outlined"
          size={isMobile ? "small" : "medium"}
        />
      </Box>

      {/* Contenido principal */}
      <Paper 
        elevation={0} 
        variant="outlined" 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper'
        }}
      >
        {plantillas.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <DescriptionIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">
              No hay plantillas disponibles en este momento.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            {isMobile ? renderMobileView() : isTablet ? renderTabletView() : renderDesktopView()}
          </Box>
        )}
      </Paper>

      {/* Snackbars */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ 
          vertical: 'bottom', 
          horizontal: isMobile ? 'center' : 'right' 
        }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSuccess('')}
          sx={{ width: '100%' }}
        >
          {success}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError('')}
        anchorOrigin={{ 
          vertical: 'bottom', 
          horizontal: isMobile ? 'center' : 'right' 
        }}
      >
        <Alert 
          severity="error" 
          onClose={() => setError('')}
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}