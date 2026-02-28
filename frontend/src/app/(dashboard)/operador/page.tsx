// frontend/src/app/(dashboard)/operador/page.tsx
'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Box, Typography, Card, CardContent, Chip, Button,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Grid, LinearProgress, IconButton, Drawer,
  useMediaQuery, useTheme, Alert, Snackbar
} from '@mui/material';
import './operador-styles.css';
import { SolicitudOperador } from '@/features/solicitudes/solicitud.types';
import { HabilitacionTransferencia } from '@/features/transferencias/transferencia.types';
import { TransferenciaBancaria } from '@/features/transferencias/transferencia.types';
import { RevisionData } from '@/features/operador/revision.types';
import { Contrato } from '@/features/contratos/contrato.types';
import RevisionModal from '@/components/operador/RevisionModal';
import { FirmaExistente } from '@/features/firma_digital/firmaDigital.types';

interface FiltrosState {
  estado: string;
  nivel_riesgo: string;
  fecha_desde: string;
  fecha_hasta: string;
  numero_solicitud: string;
  dni: string;
}

interface FiltrosContentProps {
  pendingFiltros: FiltrosState;
  setPendingFiltros: React.Dispatch<React.SetStateAction<FiltrosState>>;
  handleAplicarFiltros: () => void;
  handleLimpiarFiltros: () => void;
  verificarTodasLasFirmas: () => Promise<void>;
  actualizando: boolean;
  isMobile: boolean;
}

function FiltrosContent({
  pendingFiltros,
  setPendingFiltros,
  handleAplicarFiltros,
  handleLimpiarFiltros,
  verificarTodasLasFirmas,
  actualizando,
  isMobile,
}: FiltrosContentProps) {
  return (
    <Box className="filters-content">
      <Typography variant="h6" gutterBottom sx={{ display: { xs: 'none', md: 'block' } }}>
        Filtros y búsqueda
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Estado</InputLabel>
            <Select
              value={pendingFiltros.estado}
              onChange={(e) => setPendingFiltros(prev => ({ ...prev, estado: e.target.value }))}
              label="Estado"
            >
              <MenuItem value="">Todos los estados</MenuItem>
              <MenuItem value="borrador">Borrador</MenuItem>
              <MenuItem value="enviado">Enviado</MenuItem>
              <MenuItem value="en_revision">En revisión</MenuItem>
              <MenuItem value="pendiente_info">Pendiente info</MenuItem>
              <MenuItem value="aprobado">Aprobado</MenuItem>
              <MenuItem value="rechazado">Rechazado</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Nivel Riesgo</InputLabel>
            <Select
              value={pendingFiltros.nivel_riesgo}
              onChange={(e) => setPendingFiltros(prev => ({ ...prev, nivel_riesgo: e.target.value }))}
              label="Nivel Riesgo"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="bajo">Bajo</MenuItem>
              <MenuItem value="medio">Medio</MenuItem>
              <MenuItem value="alto">Alto</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth type="date" size="small" label="Desde"
            value={pendingFiltros.fecha_desde}
            onChange={(e) => setPendingFiltros(prev => ({ ...prev, fecha_desde: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth type="date" size="small" label="Hasta"
            value={pendingFiltros.fecha_hasta}
            onChange={(e) => setPendingFiltros(prev => ({ ...prev, fecha_hasta: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth size="small"
            label="Número Solicitud"
            placeholder="Buscar por número"
            value={pendingFiltros.numero_solicitud}
            onChange={(e) => setPendingFiltros(prev => ({ ...prev, numero_solicitud: e.target.value }))}
          />
        </Grid>

      </Grid>

      <Box className="action-buttons" sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          onClick={verificarTodasLasFirmas}
          variant="outlined" color="primary"
          size={isMobile ? 'small' : 'medium'}
          fullWidth={isMobile}
        >
          Verificar Firmas
        </Button>
        <Button
          variant="contained" className="btn-primary"
          onClick={handleAplicarFiltros}
          size={isMobile ? 'small' : 'medium'}
          fullWidth={isMobile}
          startIcon={<RefreshIcon />}
          disabled={actualizando}
        >
          {actualizando ? 'Actualizando...' : 'Aplicar'}
        </Button>
        <Button
          variant="outlined" className="btn-secondary"
          onClick={handleLimpiarFiltros}
          size={isMobile ? 'small' : 'medium'}
          fullWidth={isMobile}
        >
          Limpiar
        </Button>
      </Box>
    </Box>
  );
}
// ─────────────────────────────────────────────────────────────

const filtrosIniciales: FiltrosState = {
  estado: '', nivel_riesgo: '', fecha_desde: '',
  fecha_hasta: '', numero_solicitud: '', dni: ''
};

export default function OperadorDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { toast } = useToast();

  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date());
  const [actualizando, setActualizando] = useState(false);
  const [solicitudes, setSolicitudes] = useState<SolicitudOperador[]>([]);
  const [habilitaciones, setHabilitaciones] = useState<{ [key: string]: HabilitacionTransferencia }>({});
  const [loading, setLoading] = useState(true);

  // filtrosActivos: los que se envían al backend (solo cambian al hacer clic en Aplicar)
  // pendingFiltros: los que el usuario está editando en el formulario
  const [filtrosActivos, setFiltrosActivos] = useState<FiltrosState>(filtrosIniciales);
  const [pendingFiltros, setPendingFiltros] = useState<FiltrosState>(filtrosIniciales);

  const initialLoadDone = useRef(false);

  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<RevisionData | null>(null);
  const [modalRevision, setModalRevision] = useState(false);
  const [cargandoTransferencia, setCargandoTransferencia] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');

  const metricas = useMemo(() => {
    if (!solicitudes.length) {
      return { totalSolicitudes: 0, aprobadas: 0, enRevision: 0, montoDesembolsado: 0, listasParaTransferencia: 0 };
    }
    const totalSolicitudes = solicitudes.length;
    const aprobadas = solicitudes.filter(s => s.estado === 'aprobado').length;
    const enRevision = solicitudes.filter(s =>
      s.estado === 'en_revision' || s.estado === 'pendiente_info'
    ).length;
    const montoDesembolsado = solicitudes.reduce((total, solicitud) => {
      const t = solicitud.transferencias_bancarias?.find((t: TransferenciaBancaria) => t.estado === 'completada');
      return t ? total + (parseFloat(t.monto.toString()) || 0) : total;
    }, 0);
    const listasParaTransferencia = solicitudes.filter(solicitud => {
      const tieneContratoFirmado = solicitud.contratos?.some((c: Contrato) => c.estado === 'firmado_completo');
      const tieneTransferenciaCompletada = solicitud.transferencias_bancarias?.some((t: TransferenciaBancaria) => t.estado === 'completada');
      return solicitud.estado === 'aprobado' && tieneContratoFirmado && !tieneTransferenciaCompletada;
    }).length;
    return { totalSolicitudes, aprobadas, enRevision, montoDesembolsado, listasParaTransferencia };
  }, [solicitudes]);

  const mostrarNotificacion = useCallback((titulo: string, descripcion: string, severity: 'success' | 'error' | 'info') => {
    toast({ title: titulo, description: descripcion, variant: severity === 'error' ? 'destructive' : 'default' });
    setSnackbarSeverity(severity);
    setSnackbarMessage(descripcion);
    setSnackbarOpen(true);
  }, [toast]);

  const verificarHabilitaciones = useCallback(async (solicitudesActuales: SolicitudOperador[]) => {
    const session = await getSession();
    if (!session?.accessToken) return;
    const nuevasHabilitaciones: { [key: string]: HabilitacionTransferencia } = {};
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    for (const solicitud of solicitudesActuales) {
      if (solicitud.estado === 'aprobado') {
        try {
          const response = await fetch(`${API_URL}/transferencias/habilitacion/${solicitud.id}`, {
            headers: { 'Authorization': `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' }
          });
          if (response.ok) {
            const data = await response.json();
            nuevasHabilitaciones[solicitud.id] = data.data;
          }
        } catch (error) {
          console.error('Error verificando habilitación:', error);
        }
      }
    }
    setHabilitaciones(nuevasHabilitaciones);
  }, []);

  // Recibe los filtros como parámetro para poder llamarla con los filtros recién actualizados
  const cargarDashboard = useCallback(async (filtros: FiltrosState, mostrarToast = false) => {
    if (mostrarToast) setActualizando(true);
    try {
      const session = await getSession();
      if (!session?.accessToken) return;
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => { if (value) params.append(key, value); });
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/operador/dashboard?${params}`, {
        headers: { 'Authorization': `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        const nuevasSolicitudes = data.data.solicitudes || [];
        setSolicitudes(nuevasSolicitudes);
        setUltimaActualizacion(new Date());
        await verificarHabilitaciones(nuevasSolicitudes);
        if (mostrarToast) mostrarNotificacion('Datos actualizados', 'La información se ha actualizado correctamente', 'success');
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      if (mostrarToast) mostrarNotificacion('Error', 'No se pudieron actualizar los datos', 'error');
    } finally {
      setLoading(false);
      setActualizando(false);
    }
  }, [verificarHabilitaciones, mostrarNotificacion]);

  // Solo carga al montar — no depende de filtrosActivos para evitar re-ejecuciones
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      cargarDashboard(filtrosIniciales, false);
    }
  }, [cargarDashboard]);

  useEffect(() => {
    const check = async () => {
      if (sessionStorage.getItem('transferencia_completada') === 'true') {
        await cargarDashboard(filtrosActivos, true);
        sessionStorage.removeItem('transferencia_completada');
        sessionStorage.removeItem('solicitud_transferencia');
      }
    };
    check();
  }, [cargarDashboard, filtrosActivos]);

  // Al hacer clic en Aplicar: primero actualiza filtrosActivos, luego carga con esos valores
  const handleAplicarFiltros = useCallback(() => {
    setFiltrosActivos(pendingFiltros);
    cargarDashboard(pendingFiltros, true);  // usa pendingFiltros directamente
    if (isMobile) setFiltrosOpen(false);
  }, [pendingFiltros, cargarDashboard, isMobile]);

  const handleLimpiarFiltros = useCallback(() => {
    setPendingFiltros(filtrosIniciales);
    setFiltrosActivos(filtrosIniciales);
    cargarDashboard(filtrosIniciales, true);
  }, [cargarDashboard]);

  const verificarTodasLasFirmas = useCallback(async () => {
    const session = await getSession();
    if (!session?.accessToken) { mostrarNotificacion('Error', 'No se pudo verificar la sesión', 'error'); return; }
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const firmasVerificadas: Record<string, FirmaExistente> = {};
    for (const solicitud of solicitudes) {
      if (solicitud.estado === 'aprobado') {
        try {
          const res = await fetch(`${API_URL}/firmas/verificar-existente/${solicitud.id}`, {
            headers: { 'Authorization': `Bearer ${session.accessToken}` }
          });
          if (res.ok) { const d = await res.json(); firmasVerificadas[solicitud.id] = d.data; }
        } catch (e) { console.error(e); }
      }
    }
    const completas = Object.values(firmasVerificadas).filter((f: FirmaExistente) => f.firma_existente?.estado === 'firmado_completo').length;
    const pendientes = Object.values(firmasVerificadas).filter((f: FirmaExistente) => f.firma_existente && f.firma_existente.estado !== 'firmado_completo').length;
    mostrarNotificacion('Verificación completada', `Completas: ${completas}, Pendientes: ${pendientes}`, 'success');
  }, [solicitudes, mostrarNotificacion]);

  const handleDocumentoActualizado = useCallback(async () => {
    await cargarDashboard(filtrosActivos, false);
    if (solicitudSeleccionada) await handleIniciarRevision(solicitudSeleccionada.solicitud.id);
  }, [solicitudSeleccionada, filtrosActivos, cargarDashboard]);

  const handleIniciarRevision = async (solicitudId: string) => {
    try {
      const session = await getSession();
      if (!session?.accessToken) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/operador/solicitudes/${solicitudId}/revision`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.accessToken}` }
      });
      if (response.ok) { const data = await response.json(); setSolicitudSeleccionada(data.data); setModalRevision(true); }
    } catch (error) { console.error('Error iniciando revisión:', error); }
  };

  const getNombreContacto = (solicitud: SolicitudOperador) => {
    if (!solicitud?.solicitantes?.usuarios) return 'Sin contacto';
    const usuario = Array.isArray(solicitud.solicitantes.usuarios)
      ? solicitud.solicitantes.usuarios[0]
      : solicitud.solicitantes.usuarios;
    return usuario?.nombre_completo || 'Sin contacto';
  };

  const getEstadoColor = (estado: string): "default" | "success" | "warning" | "error" | "info" => {
    const colores: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
      en_revision: 'warning', pendiente_info: 'info', aprobado: 'success', rechazado: 'error', enviado: 'info', borrador: 'default'
    };
    return colores[estado] || 'default';
  };

  const getRiesgoColor = (riesgo: string): "default" | "success" | "warning" | "error" | "info" => {
    const colores: Record<string, "default" | "success" | "warning" | "error" | "info"> = { bajo: 'success', medio: 'warning', alto: 'error' };
    return colores[riesgo] || 'default';
  };

  const formatearMonto = (monto: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(monto);

  const handleTransferir = (solicitudId: string) => {
    setCargandoTransferencia(true);
    sessionStorage.setItem('transferencia_pendiente', 'true');
    sessionStorage.setItem('solicitud_transferencia', solicitudId);
    setTimeout(() => { window.location.href = `/operador/transferencias/nueva?solicitud_id=${solicitudId}`; }, 800);
  };

  const filtrosProps: FiltrosContentProps = {
    pendingFiltros, setPendingFiltros,
    handleAplicarFiltros, handleLimpiarFiltros,
    verificarTodasLasFirmas, actualizando, isMobile
  };

  return (
    <Box className="operador-dashboard">
      {/* Encabezado */}
      <Box className="dashboard-header">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" className="page-title" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
              Dashboard Operador
            </Typography>
            <Typography className="page-subtitle" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
              Bienvenido, gestión de solicitudes de crédito
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Última actualización: {ultimaActualizacion.toLocaleTimeString()}
            </Typography>
          </Box>
          {isMobile && (
            <IconButton onClick={() => setFiltrosOpen(true)} className="filter-button-mobile">
              <FilterListIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Métricas */}
      <Grid container spacing={2} className="metrics-grid">
        {[
          { label: 'Total', value: metricas.totalSolicitudes, sub: 'Solicitudes registradas', icon: <DescriptionIcon className="metric-icon" />, cls: '' },
          { label: 'Aprobadas', value: metricas.aprobadas, sub: 'Créditos aprobados', icon: <CheckCircleIcon className="metric-icon success" />, cls: ' success' },
          { label: 'En revisión', value: metricas.enRevision, sub: 'Pendientes de evaluar', icon: <ScheduleIcon className="metric-icon warning" />, cls: ' warning' },
          { label: 'Desembolsado', value: formatearMonto(metricas.montoDesembolsado), sub: 'Capital transferido', icon: <AttachMoneyIcon className="metric-icon" />, cls: '' },
        ].map(({ label, value, sub, icon, cls }) => (
          <Grid key={label} size={{ xs: 6, md: 3 }}>
            <Card className="metric-card">
              <CardContent className="metric-card-content">
                <Box className="metric-header"><span>{label}</span>{icon}</Box>
                <Typography variant="h4" className={`metric-value${cls}`}>{value}</Typography>
                <Typography className="metric-subtext">{sub}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filtros Desktop */}
      {!isMobile && (
        <Card className="content-box filters-box">
          <FiltrosContent {...filtrosProps} />
        </Card>
      )}

      {/* Filtros Mobile Drawer */}
      {isMobile && (
        <Drawer
          anchor="right" open={filtrosOpen} onClose={() => setFiltrosOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: '85vw', maxWidth: 400, p: 2 } }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Filtros</Typography>
            <IconButton onClick={() => setFiltrosOpen(false)}>✕</IconButton>
          </Box>
          <FiltrosContent {...filtrosProps} />
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
          <Typography variant="body2" color="text.secondary">
            Total: {solicitudes.length} solicitudes
          </Typography>
        </Box>

        {loading ? <LinearProgress /> : (
          <>
            {/* Tabla Desktop */}
            <Box className="table-responsive" sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
              <table className="solicitudes-table" style={{ minWidth: '1000px' }}>
                <thead>
                  <tr><th>ID</th><th>Fecha</th><th>Empresa</th><th>Contacto</th><th>Monto</th><th>Estado</th><th>Riesgo</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {solicitudes.map((solicitud) => (
                    <tr key={solicitud.id}>
                      <td className="solicitud-id">{solicitud.numero_solicitud}</td>
                      <td className="solicitud-fecha">{solicitud.created_at ? new Date(solicitud.created_at).toLocaleDateString() : '-'}</td>
                      <td className="solicitud-empresa">{solicitud.solicitantes?.nombre_empresa || 'N/A'}</td>
                      <td className="solicitud-contacto">{getNombreContacto(solicitud)}</td>
                      <td className="solicitud-monto">${solicitud.monto?.toLocaleString() || 0}</td>
                      <td><Chip label={solicitud.estado} color={getEstadoColor(solicitud.estado)} size="small" /></td>
                      <td><Chip label={solicitud.nivel_riesgo || 'no asignado'} color={getRiesgoColor(solicitud.nivel_riesgo || 'medio')} variant="outlined" size="small" /></td>
                      <td className="solicitud-acciones">
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button startIcon={<VisibilityIcon />} onClick={() => handleIniciarRevision(solicitud.id)} size="small" variant="contained" className="btn-revisar">Revisar</Button>
                          <BotonIniciarFirma solicitudId={solicitud.id} onFirmaIniciada={(data) => console.log('Firma iniciada:', data)} />
                          {habilitaciones[solicitud.id]?.habilitado ? (
                            <Button onClick={() => handleTransferir(solicitud.id)} variant="contained" color="success" size="small" className="btn-transferir">TRANSFERIR</Button>
                          ) : (
                            <Button disabled variant="outlined" size="small" className="btn-pendiente" title={habilitaciones[solicitud.id]?.motivo || 'Esperando firmas'}>
                              {habilitaciones[solicitud.id]?.tiene_firma_solicitante && !habilitaciones[solicitud.id]?.tiene_firma_operador ? 'Falta firma operador'
                                : !habilitaciones[solicitud.id]?.tiene_firma_solicitante && habilitaciones[solicitud.id]?.tiene_firma_operador ? 'Falta firma solicitante'
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

            {/* Cards Mobile */}
            <Grid container spacing={2} sx={{ display: { xs: 'flex', md: 'none' } }}>
              {solicitudes.map((solicitud) => (
                <Grid size={{ xs: 12 }} key={solicitud.id}>
                  <Card variant="outlined" className="solicitud-card-mobile">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>{solicitud.numero_solicitud}</Typography>
                          <Typography variant="subtitle1" color="primary" sx={{ fontSize: '0.9rem' }}>{solicitud.solicitantes?.nombre_empresa || 'N/A'}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Contacto: {getNombreContacto(solicitud)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                          <Chip label={solicitud.estado} color={getEstadoColor(solicitud.estado)} size="small" sx={{ height: 24, fontSize: '0.7rem' }} />
                          <Chip label={`Riesgo: ${solicitud.nivel_riesgo || 'N/A'}`} color={getRiesgoColor(solicitud.nivel_riesgo || 'medio')} variant="outlined" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                        </Box>
                      </Box>
                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 6 }}><Typography variant="subtitle2" sx={{ fontSize: '0.75rem' }}>Monto</Typography><Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>${solicitud.monto?.toLocaleString() || 0}</Typography></Grid>
                        <Grid size={{ xs: 6 }}><Typography variant="subtitle2" sx={{ fontSize: '0.75rem' }}>Fecha</Typography><Typography sx={{ fontSize: '0.9rem' }}>{solicitud.created_at ? new Date(solicitud.created_at).toLocaleDateString() : '-'}</Typography></Grid>
                      </Grid>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button variant="contained" onClick={() => handleIniciarRevision(solicitud.id)} size="small" sx={{ flex: 1 }}>Revisar</Button>
                        <BotonIniciarFirma solicitudId={solicitud.id} onFirmaIniciada={(data) => console.log('Firma iniciada:', data)} />
                        {habilitaciones[solicitud.id]?.habilitado
                          ? <Button onClick={() => handleTransferir(solicitud.id)} variant="contained" color="success" size="small" sx={{ flex: 1 }}>Transferir</Button>
                          : <Button disabled variant="outlined" size="small" sx={{ flex: 1 }}>Pendiente</Button>}
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
            <Typography variant="body1" color="text.secondary">No se encontraron solicitudes con los filtros aplicados</Typography>
          </Box>
        )}
      </Card>

      {solicitudSeleccionada && (
        <RevisionModal open={modalRevision} onClose={() => setModalRevision(false)} data={solicitudSeleccionada} onDocumentoActualizado={handleDocumentoActualizado} />
      )}

      {cargandoTransferencia && (
        <Box className="transferencia-overlay">
          <Box className="spinner" />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>Procesando transferencia...</Typography>
        </Box>
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)} sx={{ width: '100%' }}>{snackbarMessage}</Alert>
      </Snackbar>
    </Box>
  );
}