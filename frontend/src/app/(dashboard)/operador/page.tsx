// frontend/src/app/(dashboard)/operador/page.tsx
'use client';
import { useRouter, useParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import React, { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
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
import { HabilitacionTransferencia } from '@/types/transferencias';


export default function OperadorDashboard() {
  const router = useRouter();
  const params = useParams();
  const [procesandoForzar, setProcesandoForzar] = useState<{[key:string]: boolean}>({});

  const [solicitudes, setSolicitudes] = useState<SolicitudOperador[]>([]);
  const [habilitaciones, setHabilitaciones] = useState<{[key: string]: HabilitacionTransferencia}>({});
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    estado: '',
    nivel_riesgo: '',
    fecha_desde: '',
    fecha_hasta: '',
    numero_solicitud: '',
    dni: ''
  });
  
  // Estados para las métricas
  const [metricas, setMetricas] = useState({
    totalSolicitudes: 0,
    aprobadas: 0,
    enRevision: 0,
    montoAprobado: 0
  });

  const solicitudId = params?.id as string;
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<RevisionData | null>(null);
  const [modalRevision, setModalRevision] = useState(false);
  const [revisionData, setRevisionData] = useState<RevisionData | null>(null);

  // Función para calcular métricas basadas en las solicitudes
  const calcularMetricas = (solicitudesData: SolicitudOperador[]) => {
    const totalSolicitudes = solicitudesData.length;
    
    const aprobadas = solicitudesData.filter(s => s.estado === 'aprobado').length;
    
    const enRevision = solicitudesData.filter(s => 
      s.estado === 'en_revision' || s.estado === 'pendiente_info'
    ).length;
    
    const montoAprobado = solicitudesData
      .filter(s => s.estado === 'aprobado')
      .reduce((total, solicitud) => {
        // Convertir a número y sumar
        const monto = typeof solicitud.monto === 'number' ? solicitud.monto : parseFloat(solicitud.monto) || 0;
        return total + monto;
      }, 0);

    setMetricas({
      totalSolicitudes,
      aprobadas,
      enRevision,
      montoAprobado
    });
  };
 
  // Actualizar métricas cuando cambien las solicitudes
  useEffect(() => {
    if (solicitudes.length > 0) {
      calcularMetricas(solicitudes);
    } else {
      // Resetear métricas si no hay solicitudes
      setMetricas({
        totalSolicitudes: 0,
        aprobadas: 0,
        enRevision: 0,
        montoAprobado: 0
      });
    }
  }, [solicitudes]);

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

const verificarFirmasDigitales = async () => {
  const session = await getSession();
  const nuevasFirmas: {[key: string]: any} = {};

  for (const solicitud of solicitudes) {
    if (solicitud.estado === 'aprobado') {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        // Verificar si existe proceso de firma
        const response = await fetch(`${API_URL}/firmas/verificar-existente/${solicitud.id}`, {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          nuevasFirmas[solicitud.id] = data.data;
          
          console.log(`📋 Estado firma digital para ${solicitud.id}:`, {
            existe_firma: data.data.existe,
            estado: data.data.firma_existente?.estado
          });
        } else {
          console.error(`Error verificando firma para ${solicitud.id}:`, response.status);
        }
      } catch (error) {
        console.error('Error verificando firma digital:', error);
      }
    }
  }
  
  return nuevasFirmas;
};
const verificarTodasLasFirmas = async () => {
  const session = await getSession();
  if (!session?.accessToken) {
    toast({
      title: "Error de autenticación",
      description: "No se pudo verificar la sesión",
      variant: "destructive",
    });
    return;
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const firmasVerificadas: {[key: string]: any} = {};

  try {
    for (const solicitud of solicitudes) {
      if (solicitud.estado === 'aprobado') {
        try {
          const response = await fetch(`${API_URL}/firmas/verificar-existente/${solicitud.id}`, {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            firmasVerificadas[solicitud.id] = data.data;
            
            console.log(`📋 Estado firma para ${solicitud.numero_solicitud}:`, {
              existe: data.data.existe,
              estado: data.data.firma_existente?.estado
            });
          }
        } catch (error) {
          console.error(`Error verificando firma ${solicitud.id}:`, error);
        }
      }
    }

    // Mostrar resumen
    const firmasCompletas = Object.values(firmasVerificadas).filter(
      (f: any) => f.firma_existente?.estado === 'firmado_completo'
    ).length;
    
    const firmasPendientes = Object.values(firmasVerificadas).filter(
      (f: any) => f.firma_existente && f.firma_existente.estado !== 'firmado_completo'
    ).length;

    toast({
      title: "Verificación de firmas completada",
      description: `Firmas completas: ${firmasCompletas}, Pendientes: ${firmasPendientes}`,
      variant: "default",
    });

  } catch (error) {
    console.error('Error verificando firmas:', error);
    toast({
      title: "Error",
      description: "Error verificando firmas digitales",
      variant: "destructive",
    });
  }
};
const verificarHabilitaciones = async () => {
  const nuevasHabilitaciones: {[key: string]: HabilitacionTransferencia} = {};
  const session = await getSession();

  for (const solicitud of solicitudes) {
    if (solicitud.estado === 'aprobado') {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        // SOLO verificar habilitación, NO forzar actualización aquí
        const response = await fetch(`${API_URL}/transferencias/habilitacion/${solicitud.id}`, {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          nuevasHabilitaciones[solicitud.id] = data.data;
          
          console.log(`. Estado transferencia para ${solicitud.id}:`, {
            habilitado: data.data.habilitado,
            motivo: data.data.motivo,
            estado_firma: data.data.estado_firma
          });
        } else {
          console.error(`Error verificando habilitación para ${solicitud.id}:`, response.status);
        }
      } catch (error) {
        console.error('Error verificando habilitación:', error);
      }
    }
  }
  
  setHabilitaciones(nuevasHabilitaciones);
};
const handleForzarVerificacion = async () => {
  const session = await getSession();
  if (!session?.accessToken) {
    toast({
      title: "Error de autenticación",
      description: "No se pudo verificar la sesión",
      variant: "destructive",
    });
    return;
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const nuevosProcesos: { [key: string]: boolean } = {};
  const nuevasHabilitaciones: { [key: string]: HabilitacionTransferencia } = {};
  const nuevasFirmas: { [key: string]: any } = {};

  try {
    // Iteramos todas las solicitudes aprobadas
    for (const solicitud of solicitudes) {
      if (solicitud.estado === 'aprobado') {
        nuevosProcesos[solicitud.id] = true;
        setProcesandoForzar({ ...nuevosProcesos });

        try {
          console.log(`🔄 Forzando verificación para solicitud: ${solicitud.id}`);
          
          // PRIMERO: Verificar y forzar actualización de firma digital si es necesario
          let procesoFirmaExiste = false;
          
          // Verificar si existe proceso de firma
          const firmaResponse = await fetch(`${API_URL}/firmas/verificar-existente/${solicitud.id}`, {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (firmaResponse.ok) {
            const firmaData = await firmaResponse.json();
            procesoFirmaExiste = firmaData.data.existe;
            nuevasFirmas[solicitud.id] = firmaData.data;
            
            console.log(`📋 Proceso de firma existe para ${solicitud.id}:`, procesoFirmaExiste);
            
            // Si no existe proceso de firma, intentar iniciarlo
            if (!procesoFirmaExiste) {
              console.log(`🔄 Iniciando proceso de firma para ${solicitud.id}`);
              
              const iniciarFirmaResponse = await fetch(`${API_URL}/firmas/iniciar-proceso/${solicitud.id}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ forzar_reinicio: true })
              });
              
              if (iniciarFirmaResponse.ok) {
                console.log(`. Proceso de firma iniciado para ${solicitud.id}`);
                // Actualizar el estado de la firma
                const nuevaVerificacion = await fetch(`${API_URL}/firmas/verificar-existente/${solicitud.id}`, {
                  headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json',
                  },
                });
                if (nuevaVerificacion.ok) {
                  const nuevaData = await nuevaVerificacion.json();
                  nuevasFirmas[solicitud.id] = nuevaData.data;
                }
              } else {
                console.warn(`. No se pudo iniciar proceso de firma para ${solicitud.id}`);
              }
            }
          }

          // SEGUNDO: Forzar actualización de transferencia (como lo hacías antes)
          const res = await fetch(`${API_URL}/transferencias/forzar-actualizacion/${solicitud.id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            const errorMessage = errorData.message || `Error ${res.status}`;
            console.error(`. Error forzando verificación ${solicitud.id}:`, errorMessage);

            toast({
              title: "Error",
              description: `Error en solicitud ${solicitud.numero_solicitud}: ${errorMessage}`,
              variant: "destructive",
            });
            continue;
          }

          const data = await res.json();
          console.log(`. Forzado con éxito para ${solicitud.id}`, data);

          nuevasHabilitaciones[solicitud.id] = data.data;

          toast({
            title: "Verificación forzada",
            description: `Solicitud ${solicitud.numero_solicitud} actualizada correctamente.`,
            variant: "default",
          });

        } catch (error) {
          console.error(`Error forzando verificación de ${solicitud.id}:`, error);
        } finally {
          nuevosProcesos[solicitud.id] = false;
          setProcesandoForzar({ ...nuevosProcesos });
        }
      }
    }

    // Actualizar estados
    setHabilitaciones(prev => ({
      ...prev,
      ...nuevasHabilitaciones,
    }));

    // También puedes guardar el estado de las firmas si lo necesitas
    console.log('. Resumen de firmas verificadas:', nuevasFirmas);

  } catch (error) {
    console.error('Error general en handleForzarVerificacion:', error);
    toast({
      title: "Error de conexión",
      description: "No se pudo conectar con el servidor",
      variant: "destructive",
    });
  }
};
// Agregar intervalo de verificación automática
useEffect(() => {
    if (solicitudes.length > 0) {
        verificarHabilitaciones(); // Verificación inicial
    }
}, [solicitudes]);

  const handleTransferir = (solicitudId: string) => {
    // Navegar a la página de transferencia
    window.location.href = `/operador/transferencias/nueva?solicitud_id=${solicitudId}`;
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
      'rechazado': 'error',
      'cerrada': 'default'
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

  // Función para formatear el monto en formato de moneda
  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
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

      {/* Métricas con diseño UX - AHORA DINÁMICAS */}
      <Grid container spacing={3} className="metrics-grid">
        <Grid size={{ xs: 12, md: 3}}>
          <Card className="metric-card">
            <CardContent>
              <Box className="metric-header">
                <span>Total solicitudes</span>
                <DescriptionIcon />
              </Box>
              <Typography variant="h4" className="metric-value">
                {metricas.totalSolicitudes}
              </Typography>
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
              <Typography variant="h4" className="metric-value" style={{color: 'var(--color-status-success)'}}>
                {metricas.aprobadas}
              </Typography>
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
              <Typography variant="h4" className="metric-value" style={{color: 'var(--color-status-warning)'}}>
                {metricas.enRevision}
              </Typography>
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
              <Typography variant="h4" className="metric-value">
                {formatearMonto(metricas.montoAprobado)}
              </Typography>
              <Typography className="metric-subtext">Capital desembolsado</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* El resto del código se mantiene igual... */}
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
                <MenuItem value="cerrada">Cerrada</MenuItem>

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

        </Grid>
        <Box className="action-buttons">

<Button 
  onClick={verificarTodasLasFirmas}
  variant="outlined"
  color="primary"
  style={{ marginLeft: '8px' }}
>
  Verificar estado de las firmas de los documentos
</Button>
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
{habilitaciones[solicitud.id]?.habilitado ? (
  <Button 
    onClick={() => handleTransferir(solicitud.id)}
    variant="contained"
    color="success"
    size="small"
    style={{ marginLeft: '8px', backgroundColor: '#16a34a' }}
  >
    HACER TRANSFERENCIA
  </Button>
) : (
  <Button 
    disabled 
    variant="outlined" 
    size="small"
    style={{ marginLeft: '8px' }}
    title={habilitaciones[solicitud.id]?.motivo || 'Esperando firmas'}
  >
    {habilitaciones[solicitud.id]?.tiene_firma_solicitante && !habilitaciones[solicitud.id]?.tiene_firma_operador 
      ? 'Falta firma operador' 
      : !habilitaciones[solicitud.id]?.tiene_firma_solicitante && habilitaciones[solicitud.id]?.tiene_firma_operador 
      ? 'Falta firma solicitante'
      : 'Pendiente de firmas'}
  </Button>
)}



</td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>


            {/* Vista cards para mobile */}
            <Grid container spacing={2} sx={{ display: { xs: 'flex', md: 'none' } }}>
              {solicitudes.map((solicitud) => (
                <Grid size={{ xs: 12}} key={solicitud.id}>
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