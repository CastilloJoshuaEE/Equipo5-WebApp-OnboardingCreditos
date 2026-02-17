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
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
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
  LinearProgress,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme
} from '@mui/material';
import './operador-styles.css';
import { SolicitudOperador} from '@/features/solicitudes/solicitud.types';
import { HabilitacionTransferencia } from '@/features/transferencias/transferencia.types';
import { TransferenciaBancaria } from '@/features/transferencias/transferencia.types';
import { RevisionData } from '@/features/operador/revision.types';
import { Contrato } from '@/features/contratos/contrato.types';
import RevisionModal from '@/components/operador/RevisionModal';
export default function OperadorDashboard() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [filtrosOpen, setFiltrosOpen] = useState(false);
const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date());
  const [actualizando, setActualizando] = useState(false);
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
    montoDesembolsado: 0,
    listasParaTransferencia: 0
  });

  const solicitudId = params?.id as string;
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<RevisionData | null>(null);
  const [modalRevision, setModalRevision] = useState(false);
  const [revisionData, setRevisionData] = useState<RevisionData | null>(null);
  const [cargandoTransferencia, setCargandoTransferencia] = useState(false);

  const calcularMetricas = (solicitudesData: SolicitudOperador[]) => {
    const totalSolicitudes = solicitudesData.length;
    const aprobadas = solicitudesData.filter(s => s.estado === 'aprobado').length;
    const enRevision = solicitudesData.filter(s => 
      s.estado === 'en_revision' || s.estado === 'pendiente_info'
    ).length;
    
    const montoDesembolsado = solicitudesData.reduce((total, solicitud) => {
      if (solicitud.transferencias_bancarias && solicitud.transferencias_bancarias.length > 0) {
        const transferenciaCompletada = solicitud.transferencias_bancarias
          .find((t: TransferenciaBancaria) => t.estado === 'completada');
        if (transferenciaCompletada) {
          return total + (parseFloat(transferenciaCompletada.monto.toString()) || 0);
        }
      }
      return total;
    }, 0);

    const listasParaTransferencia = solicitudesData.filter(solicitud => {
      const tieneContratoFirmado = solicitud.contratos && 
        solicitud.contratos.some((c: Contrato) => c.estado === 'firmado_completo');
      const tieneTransferenciaCompletada = solicitud.transferencias_bancarias &&
        solicitud.transferencias_bancarias.some((t: TransferenciaBancaria) => t.estado === 'completada');
      
      return solicitud.estado === 'aprobado' && 
             tieneContratoFirmado && 
             !tieneTransferenciaCompletada;
    }).length;

    setMetricas({
      totalSolicitudes,
      aprobadas,
      enRevision,
      montoDesembolsado,
      listasParaTransferencia
    });
  };

  useEffect(() => {
    if (solicitudes.length > 0) {
      calcularMetricas(solicitudes);
    } else {
      setMetricas({
        totalSolicitudes: 0,
        aprobadas: 0,
        enRevision: 0,
        montoDesembolsado: 0,
        listasParaTransferencia: 0
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

  useEffect(() => {
    cargarDashboard();
  }, []);

  const handleLogout = async () => {
    await signOut({ 
      callbackUrl: '/login',
      redirect: true 
    });
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
            }
          } catch (error) {
            console.error(`Error verificando firma ${solicitud.id}:`, error);
          }
        }
      }

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

    if (!session?.accessToken) {
      console.error('No hay token de acceso para verificar habilitaciones');
      return;
    }

    for (const solicitud of solicitudes) {
      if (solicitud.estado === 'aprobado') {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          
          const response = await fetch(`${API_URL}/transferencias/habilitacion/${solicitud.id}`, {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            nuevasHabilitaciones[solicitud.id] = data.data;
          } else if (response.status === 403) {
            continue;
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
      for (const solicitud of solicitudes) {
        if (solicitud.estado === 'aprobado') {
          nuevosProcesos[solicitud.id] = true;
          setProcesandoForzar({ ...nuevosProcesos });

          try {
            let procesoFirmaExiste = false;
            
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
              
              if (!procesoFirmaExiste) {
                const iniciarFirmaResponse = await fetch(`${API_URL}/firmas/iniciar-proceso/${solicitud.id}`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ forzar_reinicio: true })
                });
                
                if (iniciarFirmaResponse.ok) {
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
                }
              }
            }

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
              toast({
                title: "Error",
                description: `Error en solicitud ${solicitud.numero_solicitud}: ${errorMessage}`,
                variant: "destructive",
              });
              continue;
            }

            const data = await res.json();
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

      setHabilitaciones(prev => ({
        ...prev,
        ...nuevasHabilitaciones,
      }));

    } catch (error) {
      console.error('Error general en handleForzarVerificacion:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (solicitudes.length > 0) {
      verificarHabilitaciones();
    }
  }, [solicitudes]);
  useEffect(() => {
    const transferenciaCompletada = sessionStorage.getItem('transferencia_completada');
    const solicitudId = sessionStorage.getItem('solicitud_transferencia');
    
    if (transferenciaCompletada === 'true' && solicitudId) {
      console.log('Detectada transferencia completada, actualizando datos...');
      cargarDashboard(true);
      verificarHabilitaciones();
      
      // Limpiar el flag
      sessionStorage.removeItem('transferencia_completada');
      sessionStorage.removeItem('solicitud_transferencia');
    }
  }, []);
  const handleTransferir = (solicitudId: string) => {
    setCargandoTransferencia(true);
    
    // Guardar en sessionStorage para que la página de transferencia lo detecte
    sessionStorage.setItem('transferencia_pendiente', 'true');
    sessionStorage.setItem('solicitud_transferencia', solicitudId);
    
    setTimeout(() => {
      window.location.href = `/operador/transferencias/nueva?solicitud_id=${solicitudId}`;
    }, 800);
  };

   const cargarDashboard = async (forzar = false) => {
    if (forzar) {
      setActualizando(true);
    }
    
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
      const response = await fetch(`${API_URL}/operador/dashboard?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'        }
      });

      if (response.ok) {
        const data = await response.json();
        setSolicitudes(data.data.solicitudes || []);
        setUltimaActualizacion(new Date());
        
        if (forzar) {
          toast({
            title: "Datos actualizados",
            description: "La información se ha actualizado correctamente",
            variant: "default",
          });
        }
      } else {
        const errorText = await response.text();
        console.error('Error cargando dashboard:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      if (forzar) {
        toast({
          title: "Error",
          description: "No se pudieron actualizar los datos",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setActualizando(false);
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

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  const FiltrosContent = () => (
    <Box className="filters-content">
      <Typography variant="h6" gutterBottom sx={{ display: { xs: 'none', md: 'block' } }}>
        Filtros y búsqueda
      </Typography>
      
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6}}>
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
        <Grid size={{ xs: 12, md: 6}}>
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
        <Grid size={{ xs: 12, md: 6}}>
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
        <Grid size={{ xs: 12, md: 6}}>
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
        <Grid size={{ xs: 12, md: 3}}>
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

      <Box className="action-buttons" sx={{ mt: 2 }}>
        <Button 
          onClick={verificarTodasLasFirmas}
          variant="outlined"
          color="primary"
          size={isMobile ? "small" : "medium"}
          fullWidth={isMobile}
        >
          Verificar Firmas
        </Button>
        <Button 
          variant="contained" 
          className="btn-primary"
  onClick={() => cargarDashboard()}
            size={isMobile ? "small" : "medium"}
          fullWidth={isMobile}
          startIcon={<RefreshIcon />}
        >
          Aplicar
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
          size={isMobile ? "small" : "medium"}
          fullWidth={isMobile}
        >
          Limpiar
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box className="operador-dashboard">
      {/* Encabezado */}
      <Box className="dashboard-header">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" className="page-title" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
              Dashboard
            </Typography>
            <Typography className="page-subtitle" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
              Bienvenido, gestión de solicitudes de crédito
            </Typography>
          </Box>
          {isMobile && (
            <IconButton 
              onClick={() => setFiltrosOpen(true)}
              className="filter-button-mobile"
            >
              <FilterListIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Métricas */}
      <Grid container spacing={2} className="metrics-grid">
        <Grid size={{ xs: 6, md: 3}}>
          <Card className="metric-card">
            <CardContent className="metric-card-content">
              <Box className="metric-header">
                <span>Total</span>
                <DescriptionIcon className="metric-icon" />
              </Box>
              <Typography variant="h4" className="metric-value">
                {metricas.totalSolicitudes}
              </Typography>
              <Typography className="metric-subtext">Solicitudes registradas</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3}}>
          <Card className="metric-card">
            <CardContent className="metric-card-content">
              <Box className="metric-header">
                <span>Aprobadas</span>
                <CheckCircleIcon className="metric-icon success" />
              </Box>
              <Typography variant="h4" className="metric-value success">
                {metricas.aprobadas}
              </Typography>
              <Typography className="metric-subtext">Créditos aprobados</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3}}>
          <Card className="metric-card">
            <CardContent className="metric-card-content">
              <Box className="metric-header">
                <span>En revisión</span>
                <ScheduleIcon className="metric-icon warning" />
              </Box>
              <Typography variant="h4" className="metric-value warning">
                {metricas.enRevision}
              </Typography>
              <Typography className="metric-subtext">Pendientes de evaluar</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3}}>
          <Card className="metric-card">
            <CardContent className="metric-card-content">
              <Box className="metric-header">
                <span>Desembolsado</span>
                <AttachMoneyIcon className="metric-icon" />
              </Box>
              <Typography variant="h4" className="metric-value">
                {formatearMonto(metricas.montoDesembolsado)}
              </Typography>
              <Typography className="metric-subtext">Capital transferido</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros - Desktop */}
      {!isMobile && (
        <Card className="content-box filters-box">
          <FiltrosContent />
        </Card>
      )}

      {/* Filtros - Mobile Drawer */}
      {isMobile && (
        <Drawer
          anchor="right"
          open={filtrosOpen}
          onClose={() => setFiltrosOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: '85vw',
              maxWidth: 400,
              p: 2
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Filtros</Typography>
            <IconButton onClick={() => setFiltrosOpen(false)}>
              <span>✕</span>
            </IconButton>
          </Box>
          <FiltrosContent />
        </Drawer>
      )}

      {/* Lista de Solicitudes */}
      <Card className="content-box solicitudes-box">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              Solicitudes de crédito
            </Typography>
            <Typography className="page-subtitle" sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
              Gestiona y evalúa las solicitudes de crédito de las PYMES
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
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
                      <td className="solicitud-id">{solicitud.numero_solicitud}</td>
                      <td className="solicitud-fecha">
                        {new Date(solicitud.created_at).toLocaleDateString()}
                      </td>
                      <td className="solicitud-empresa">
                        {solicitud.solicitantes?.nombre_empresa}
                      </td>
                      <td className="solicitud-contacto">
                        {getNombreContacto(solicitud)}
                      </td>
                      <td className="solicitud-monto">
                        ${solicitud.monto.toLocaleString()}
                      </td>
                      <td className="solicitud-estado">
                        <Chip 
                          label={solicitud.estado} 
                          color={getEstadoColor(solicitud.estado)}
                          size="small"
                        />
                      </td>
                      <td className="solicitud-riesgo">
                        <Chip 
                          label={solicitud.nivel_riesgo}
                          color={getRiesgoColor(solicitud.nivel_riesgo)}
                          variant="outlined"
                          size="small"
                        />
                      </td>
                      <td className="solicitud-acciones">
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleIniciarRevision(solicitud.id)}
                            size="small"
                            variant="contained"
                            className="btn-revisar"
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
                              className="btn-transferir"
                            >
                              TRANSFERIR
                            </Button>
                          ) : (
                            <Button 
                              disabled 
                              variant="outlined" 
                              size="small"
                              className="btn-pendiente"
                              title={habilitaciones[solicitud.id]?.motivo || 'Esperando firmas'}
                            >
                              {habilitaciones[solicitud.id]?.tiene_firma_solicitante && !habilitaciones[solicitud.id]?.tiene_firma_operador 
                                ? 'Falta firma operador' 
                                : !habilitaciones[solicitud.id]?.tiene_firma_solicitante && habilitaciones[solicitud.id]?.tiene_firma_operador 
                                ? 'Falta firma solicitante'
                                : 'Pendiente'}
                            </Button>
                          )}
                        </Box>
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                            {solicitud.numero_solicitud}
                          </Typography>
                          <Typography variant="subtitle1" color="primary" sx={{ fontSize: '0.9rem' }}>
                            {solicitud.solicitantes?.nombre_empresa || 'Empresa no encontrada'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            Contacto: {getNombreContacto(solicitud)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                          <Chip 
                            label={solicitud.estado} 
                            color={getEstadoColor(solicitud.estado)}
                            size="small"
                            sx={{ height: 24, fontSize: '0.7rem' }}
                          />
                          <Chip 
                            label={`Riesgo: ${solicitud.nivel_riesgo}`}
                            color={getRiesgoColor(solicitud.nivel_riesgo)}
                            variant="outlined"
                            size="small"
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                        </Box>
                      </Box>

                      <Grid container spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Grid size={{ xs: 6}}>
                          <Typography variant="subtitle2" sx={{ fontSize: '0.75rem' }}>Monto</Typography>
                          <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            ${solicitud.monto.toLocaleString()}
                          </Typography>
                        </Grid>
        <Grid size={{ xs: 6}}>
                          <Typography variant="subtitle2" sx={{ fontSize: '0.75rem' }}>Fecha</Typography>
                          <Typography sx={{ fontSize: '0.9rem' }}>
                            {new Date(solicitud.created_at).toLocaleDateString()}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button 
                          variant="contained"
                          onClick={() => handleIniciarRevision(solicitud.id)}
                          size="small"
                          sx={{ fontSize: '0.75rem', minWidth: 'auto', flex: 1 }}
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
                            sx={{ fontSize: '0.75rem', minWidth: 'auto', flex: 1 }}
                          >
                            Transferir
                          </Button>
                        ) : (
                          <Button 
                            disabled 
                            variant="outlined" 
                            size="small"
                            sx={{ fontSize: '0.75rem', minWidth: 'auto', flex: 1 }}
                          >
                            Pendiente
                          </Button>
                        )}
                      </Box>
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

      {/* Overlay de carga para transferencia */}
      {cargandoTransferencia && (
        <Box className="transferencia-overlay">
          <Box className="spinner"></Box>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Procesando transferencia...
          </Typography>
        </Box>
      )}
    </Box>
  );
}