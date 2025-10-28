// frontend/src/app/(dashboard)/operador/page.tsx
'use client';
import { useRouter, useParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import React, { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import BotonIniciarFirma from '@/components/BotonIniciarFirma';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  LinearProgress
} from '@mui/material';
import { Documento, RevisionData, SolicitudOperador } from '@/types/operador';
import RevisionModal from '@/components/operador/RevisionModal';
import './operador-styles.css';

interface BotonIniciarFirmaProps {
  solicitudId: string;
  onFirmaIniciada: (data: any) => void;
}

export default function OperadorDashboard() {
  const router = useRouter();
  const params = useParams();
  
  const [solicitudes, setSolicitudes] = useState<SolicitudOperador[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    estado: '',
    nivel_riesgo: '',
    fecha_desde: '',
    fecha_hasta: '',
    numero_solicitud: '',
    dni: ''
  });
  const solicitudId = params?.id as string;
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<RevisionData | null>(null);
  const [modalRevision, setModalRevision] = useState(false);
  const [revisionData, setRevisionData] = useState<RevisionData | null>(null);

  // Función para refrescar datos después de validar
  const handleDocumentoActualizado = async () => {
    console.log('Refrescando datos después de validación...');
    await cargarDashboard();
    
    if (solicitudSeleccionada) {
      await handleIniciarRevision(solicitudSeleccionada.solicitud.id);
    }
  };

  const getNombreContacto = (solicitud: SolicitudOperador) => {
    if (!solicitud?.solicitantes?.usuarios) {
      return 'Sin contacto';
    }

    const usuario = Array.isArray(solicitud.solicitantes.usuarios) 
      ? solicitud.solicitantes.usuarios[0] 
      : solicitud.solicitantes.usuarios;
    
    return usuario?.nombre_completo || 'Sin contacto';
  };

  // También obtener email y teléfono para mostrar
  const getContactoInfo = (solicitud: SolicitudOperador) => {
    if (!solicitud.solicitantes?.usuarios) {
      return {
        nombre: 'No disponible',
        email: 'No disponible', 
        telefono: 'No disponible'
      };
    }
    
    const usuario = solicitud.solicitantes.usuarios;
    return {
      nombre: usuario?.nombre_completo || 'No disponible',
      email: usuario?.email || 'No disponible',
      telefono: usuario?.telefono || 'No disponible'
    };
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  const handleLogout = async () => {
    await signOut({ 
      callbackUrl: '/login',
      redirect: true 
    });
  };

  const cargarDashboard = async () => {
    try {
      const session = await getSession();
      if (!session?.accessToken) {
        console.error('No hay token de acceso');
        return;
      }

      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      console.log(`Solicitando dashboard: ${API_URL}/operador/dashboard?${params}`);

      const response = await fetch(`${API_URL}/operador/dashboard?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Respuesta del servidor: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard cargado:', data);
        setSolicitudes(data.data.solicitudes || []);
      } else {
        const errorText = await response.text();
        console.error('Error cargando dashboard:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarRevision = async (solicitudId: string) => {
    try {
      const session = await getSession();
      if (!session?.accessToken) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${API_URL}/operador/solicitudes/${solicitudId}/revision`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSolicitudSeleccionada(data.data);
        setModalRevision(true);
      } else {
        console.error('Error en respuesta:', response.status);
      }
    } catch (error) {
      console.error('Error iniciando revisión:', error);
    }
  };

  const getEstadoColor = (estado: string) => {
    const colores: any = {
      'en_revision': 'warning',
      'pendiente_info': 'info',
      'aprobado': 'success',
      'rechazado': 'error'
    };
    return colores[estado] || 'default';
  };

  const getRiesgoColor = (riesgo: string) => {
    const colores: any = {
      'bajo': 'success',
      'medio': 'warning',
      'alto': 'error'
    };
    return colores[riesgo] || 'default';
  };

  return (
    <Box className="operador-dashboard">
      {/* Encabezado con diseño UX */}
      <Box className="dashboard-header">
        <Typography variant="h4" className="page-title">
          Dashboard
        </Typography>
        <Typography className="page-subtitle">
          Bienvenido Juan, gestión de solicitudes de crédito
        </Typography>
      </Box>

      {/* Métricas con diseño UX */}
      <Grid container spacing={3} className="metrics-grid">
        <Grid size={{ xs: 12, md: 3}}>
        
          <Card className="metric-card">
            <CardContent>
              <Box className="metric-header">
                <span>Total solicitudes</span>
<DescriptionIcon />
              </Box>
              <Typography variant="h4" className="metric-value">15</Typography>
              <Typography className="metric-subtext">Solicitudes registradas</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3}}>
          <Card className="metric-card">
            <CardContent>
              <Box className="metric-header">
                <span>Aprobadas</span>
  <CheckCircleIcon style={{color: 'var(--color-status-success)'}} />
              </Box>
              <Typography variant="h4" className="metric-value" style={{color: 'var(--color-status-success)'}}>8</Typography>
              <Typography className="metric-subtext">Créditos aprobados</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3}}>
          <Card className="metric-card">
            <CardContent>
              <Box className="metric-header">
                <span>En revisión</span>
<ScheduleIcon style={{ color: 'var(--color-status-warning)' }} />
              </Box>
              <Typography variant="h4" className="metric-value" style={{color: 'var(--color-status-warning)'}}>5</Typography>
              <Typography className="metric-subtext">Pendientes de evaluar</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3}}>
          <Card className="metric-card">
            <CardContent>
              <Box className="metric-header">
                <span>Monto aprobado</span>
  <AttachMoneyIcon />
              </Box>
              <Typography variant="h4" className="metric-value">$ 36.140.000</Typography>
              <Typography className="metric-subtext">Capital desembolsado</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros combinados */}
      <Card className="content-box filters-box">
        <Typography variant="h6" gutterBottom>Filtros y búsqueda</Typography>
        <Grid container spacing={2} className="filter-grid">
        <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filtros.estado}
                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                label="Estado"
              >
                <MenuItem value="">Todos los estados</MenuItem>
                <MenuItem value="en_revision">En revisión</MenuItem>
                <MenuItem value="aprobado">Aprobado</MenuItem>
                <MenuItem value="rechazado">Rechazado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        <Grid size={{ xs: 12, md: 3}}>
            <FormControl fullWidth size="small">
              <InputLabel>Nivel Riesgo</InputLabel>
              <Select
                value={filtros.nivel_riesgo}
                onChange={(e) => setFiltros({...filtros, nivel_riesgo: e.target.value})}
                label="Nivel Riesgo"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="bajo">Bajo</MenuItem>
                <MenuItem value="medio">Medio</MenuItem>
                <MenuItem value="alto">Alto</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        <Grid size={{ xs: 12, md: 3}}>
            <TextField
              fullWidth
              type="date"
              size="small"
              label="Desde"
              value={filtros.fecha_desde}
              onChange={(e) => setFiltros({...filtros, fecha_desde: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        <Grid size={{ xs: 12, md: 3}}>
            <TextField
              fullWidth
              type="date"
              size="small"
              label="Hasta"
              value={filtros.fecha_hasta}
              onChange={(e) => setFiltros({...filtros, fecha_hasta: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        <Grid size={{ xs: 12, md: 6}}>
            <TextField
              fullWidth
              size="small"
              label="Número Solicitud"
              placeholder="Buscar por número"
              value={filtros.numero_solicitud}
              onChange={(e) => setFiltros({...filtros, numero_solicitud: e.target.value})}
            />
          </Grid>
        <Grid size={{ xs: 12, md: 6}}>
            <TextField
              fullWidth
              size="small"
              label="DNI Solicitante"
              placeholder="Buscar por DNI"
              value={filtros.dni}
              onChange={(e) => setFiltros({...filtros, dni: e.target.value})}
            />
          </Grid>
        </Grid>
        <Box className="action-buttons">
          <Button 
            variant="contained" 
            className="btn-primary"
            onClick={cargarDashboard}
          >
            Aplicar Filtros
          </Button>
          <Button 
            variant="outlined" 
            className="btn-secondary"
            onClick={() => {
              setFiltros({
                estado: '',
                nivel_riesgo: '',
                fecha_desde: '',
                fecha_hasta: '',
                numero_solicitud: '',
                dni: ''
              });
              cargarDashboard();
            }}
          >
            Limpiar
          </Button>

        </Box>
      </Card>

      {/* Lista de Solicitudes - Versión tabla para escritorio, cards para mobile */}
      <Card className="content-box">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>Solicitudes de crédito</Typography>
            <Typography className="page-subtitle">
              Gestiona y evalúa las solicitudes de crédito de las PYMES
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Total: {solicitudes.length} solicitudes
          </Typography>
        </Box>
        
        {loading ? (
          <LinearProgress />
        ) : (
          <>
            {/* Vista tabla para escritorio */}
            <Box className="table-responsive" sx={{ display: { xs: 'none', md: 'block' } }}>
              <table className="solicitudes-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Empresa</th>
                    <th>Contacto</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Riesgo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map((solicitud) => (
                    <tr key={solicitud.id}>
                      <td>{solicitud.numero_solicitud}</td>
                      <td>{new Date(solicitud.created_at).toLocaleDateString()}</td>
                      <td>{solicitud.solicitantes?.nombre_empresa}</td>
                      <td>{getNombreContacto(solicitud)}</td>
                      <td>${solicitud.monto.toLocaleString()}</td>
                      <td>
                        <Chip 
                          label={solicitud.estado} 
                          color={getEstadoColor(solicitud.estado)}
                          size="small"
                        />
                      </td>
                      <td>
                        <Chip 
                          label={solicitud.nivel_riesgo}
                          color={getRiesgoColor(solicitud.nivel_riesgo)}
                          variant="outlined"
                          size="small"
                        />
                      </td>
                      <td>
                        <Button
  startIcon={<VisibilityIcon />}
                          onClick={() => handleIniciarRevision(solicitud.id)}
                          size="small"
                          variant="contained"
                        >
                          Revisar
                        </Button>
                        <BotonIniciarFirma 
                          solicitudId={solicitud.id} 
                          onFirmaIniciada={(data) => {
                            console.log('Firma digital iniciada:', data);
                          }} 
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

            {/* Vista cards para mobile */}
            <Grid container spacing={2} sx={{ display: { xs: 'flex', md: 'none' } }}>
              {solicitudes.map((solicitud) => (
                     <Grid size={{ xs: 12}}
 key={solicitud.id}>
                  <Card variant="outlined" className="solicitud-card-mobile">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6">
                            {solicitud.numero_solicitud}
                          </Typography>
                          <Typography variant="subtitle1" color="primary">
                            {solicitud.solicitantes?.nombre_empresa || 'Empresa no encontrada'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Contacto: {getNombreContacto(solicitud)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                          <Chip 
                            label={solicitud.estado} 
                            color={getEstadoColor(solicitud.estado)}
                            size="small"
                          />
                          <Chip 
                            label={`Riesgo: ${solicitud.nivel_riesgo}`}
                            color={getRiesgoColor(solicitud.nivel_riesgo)}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      </Box>

                      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 6}}>
                          <Typography variant="subtitle2">Monto</Typography>
                          <Typography>${solicitud.monto.toLocaleString()}</Typography>
                        </Grid>
        <Grid size={{ xs: 6}}>
                          <Typography variant="subtitle2">Fecha</Typography>
                          <Typography>
                            {new Date(solicitud.created_at).toLocaleDateString()}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>

                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button 
                              variant="contained"
                              onClick={() => handleIniciarRevision(solicitud.id)}
                              size="small"
                            >
                              Revisar
                            </Button>
                            <BotonIniciarFirma 
                              solicitudId={solicitud.id} 
                              onFirmaIniciada={(data) => {
                                console.log('Firma digital iniciada:', data);
                              }} 
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {solicitudes.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No se encontraron solicitudes con los filtros aplicados
            </Typography>
          </Box>
        )}
      </Card>

      {/* Modal de Revisión */}
      {solicitudSeleccionada && (
        <RevisionModal 
          open={modalRevision}
          onClose={() => setModalRevision(false)}
          data={solicitudSeleccionada}
          onDocumentoActualizado={handleDocumentoActualizado}
        />
      )}
    </Box>
  );
}