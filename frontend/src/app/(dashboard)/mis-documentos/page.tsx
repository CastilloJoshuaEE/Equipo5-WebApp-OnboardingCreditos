'use client';
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
} from '@mui/material';
import {
  Description,
  Download,
  Visibility,
  CheckCircle,
  Schedule,
  Error as ErrorIcon,
  ReceiptLong,
  Search,
} from '@mui/icons-material';
import { getSession } from 'next-auth/react';

// Interfaces para TypeScript
interface Contrato {
  id: string;
  numero_contrato: string;
  estado: string;
  ruta_documento: string;
  created_at: string;
  updated_at: string;
  firma_digital?: {
    id: string;
    estado: string;
    fecha_firma_completa: string;
    url_documento_firmado: string;
    ruta_documento: string;
  };
  solicitud_numero?: string;
  monto_solicitud?: number;
  moneda_solicitud?: string;
}

interface TransferenciaBancaria {
  id: string;
  solicitud_id: string;
  contrato_id: string;
  contacto_bancario_id: string;
  monto: string;
  moneda: string;
  numero_comprobante: string;
  cuenta_origen: string;
  banco_origen: string;
  cuenta_destino: string;
  banco_destino: string;
  motivo: string;
  costo_transferencia: string;
  estado: string;
  procesado_por: string;
  fecha_procesamiento: string;
  fecha_completada: string;
  ruta_comprobante: string;
  created_at: string;
  updated_at: string;
  solicitudes_credito?: {
    numero_solicitud: string;
    solicitante_id: string;
  };
  contactos_bancarios?: {
    nombre_banco: string;
    numero_cuenta: string;
    tipo_cuenta: string;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`documentos-tabpanel-${index}`}
      aria-labelledby={`documentos-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MisDocumentosPage() {
  const [tabValue, setTabValue] = useState(0);
  const [solicitudesConDocumentos, setSolicitudesConDocumentos] = useState<any[]>([]);
  const [transferencias, setTransferencias] = useState<TransferenciaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistaPreviaAbierta, setVistaPreviaAbierta] = useState(false);
  const [urlVistaPrevia, setUrlVistaPrevia] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  useEffect(() => {
    cargarTodosLosDocumentos();
  }, []);

  const cargarTodosLosDocumentos = async () => {
    try {
      setLoading(true);
      const session = await getSession();
      
      if (!session?.accessToken) {
        setError('No se encontró token de sesión');
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      // Cargar solicitudes con documentos (contratos)
      const responseSolicitudes = await fetch(`${API_URL}/solicitudes/mis-solicitudes-con-documentos`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Cargar transferencias bancarias
      const responseTransferencias = await fetch(`${API_URL}/mis-transferencias`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (responseSolicitudes.ok && responseTransferencias.ok) {
        const dataSolicitudes = await responseSolicitudes.json();
        const dataTransferencias = await responseTransferencias.json();
        
        console.log('Solicitudes cargadas:', dataSolicitudes.data);
        console.log('Transferencias cargadas:', dataTransferencias.data);
        
        setSolicitudesConDocumentos(dataSolicitudes.data || []);
        setTransferencias(dataTransferencias.data || []);
      } else {
        const errorData = await responseSolicitudes.json().catch(() => responseTransferencias.json());
        throw new Error(errorData.message || 'Error al cargar documentos');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar documentos');
      console.error('Error cargando documentos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDescargarContrato = async (contrato: Contrato) => {
    try {
      const session = await getSession();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${API_URL}/contratos/${contrato.id}/descargar`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `contrato-${contrato.numero_contrato}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Error descargando contrato:', response.status);
        alert('Error al descargar el contrato');
      }
    } catch (err) {
      console.error('Error descargando contrato:', err);
      alert('Error de conexión al descargar contrato');
    }
  };

  const handleDescargarComprobante = async (transferencia: TransferenciaBancaria) => {
    try {
      const session = await getSession();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${API_URL}/transferencias/${transferencia.id}/comprobante/descargar`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `comprobante-${transferencia.numero_comprobante}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Error descargando comprobante:', response.status);
        alert('Error al descargar el comprobante');
      }
    } catch (err) {
      console.error('Error descargando comprobante:', err);
      alert('Error de conexión al descargar comprobante');
    }
  };

  const handleVerVistaPrevia = async (tipo: 'contrato' | 'comprobante', id: string) => {
    try {
      const session = await getSession();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${API_URL}/documentos/${tipo}/${id}/ver`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUrlVistaPrevia(data.data.url);
        setVistaPreviaAbierta(true);
      } else {
        console.error('Error obteniendo vista previa:', response.status);
        alert('Error al cargar la vista previa');
      }
    } catch (err) {
      console.error('Error obteniendo vista previa:', err);
      alert('Error de conexión al cargar vista previa');
    }
  };

  const handleVerContratoFirmado = async (firmaId: string) => {
    try {
      const session = await getSession();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      console.log('ID de firma enviado:', firmaId);
      
      const response = await fetch(`${API_URL}/firmas/ver-contrato-firmado/${firmaId}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        console.error('Error response:', response.status, response.statusText);
        alert('Error al cargar el contrato firmado');
      }
    } catch (error) {
      console.error('Error viendo contrato firmado:', error);
      alert('Error de conexión');
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'firmado_completo':
      case 'vigente':
      case 'completada':
      case 'aprobado':
        return 'success';
      case 'pendiente_firma':
      case 'generado':
      case 'procesando':
      case 'pendiente':
        return 'warning';
      case 'expirado':
      case 'rechazado':
      case 'fallida':
        return 'error';
      default:
        return 'default';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'firmado_completo':
      case 'vigente':
      case 'completada':
      case 'aprobado':
        return <CheckCircle />;
      case 'pendiente_firma':
      case 'generado':
      case 'procesando':
      case 'pendiente':
        return <Schedule />;
      case 'expirado':
      case 'rechazado':
      case 'fallida':
        return <ErrorIcon />;
      default:
        return <Description />;
    }
  };

  const formatMonto = (monto: number, moneda?: string) => {
    const monedaValida = moneda && moneda.trim() !== '' ? moneda : 'USD';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: monedaValida,
      minimumFractionDigits: 2,
    }).format(monto ?? 0);
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Extraer todos los contratos para la tabla
  const todosLosContratos = solicitudesConDocumentos.flatMap(solicitud => 
    (Array.isArray(solicitud.contratos) ? solicitud.contratos : [solicitud.contratos]).filter(Boolean).map((contrato: any) => ({
      ...contrato,
      solicitud_numero: solicitud.numero_solicitud,
      monto_solicitud: solicitud.monto,
      moneda_solicitud: solicitud.moneda
    }))
  );

  // Filtrar documentos según búsqueda
  const contratosFiltrados = todosLosContratos.filter(contrato => {
    const coincideBusqueda = 
      contrato.numero_contrato?.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      contrato.solicitud_numero?.toLowerCase().includes(filtroBusqueda.toLowerCase());

    return coincideBusqueda;
  });

  const transferenciasFiltradas = transferencias.filter(transferencia => {
    const coincideBusqueda = 
      transferencia.numero_comprobante?.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      transferencia.banco_destino?.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      transferencia.cuenta_destino?.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      transferencia.motivo?.toLowerCase().includes(filtroBusqueda.toLowerCase());

    return coincideBusqueda;
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <Description sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" component="h1">
            Mis Documentos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Consulta y descarga tus contratos y comprobantes de transferencia
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filtro de búsqueda */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 8}}>
              <TextField
                fullWidth
                placeholder="Buscar por número de solicitud, contrato, comprobante o banco destino..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
                <Grid size={{ xs: 12, md: 4}}>
              <Typography variant="body2" color="text.secondary">
                {contratosFiltrados.length + transferenciasFiltradas.length} documentos encontrados
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {solicitudesConDocumentos.length === 0 && transferencias.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No tienes documentos disponibles en este momento. Los documentos aparecerán aquí 
          una vez que tus solicitudes sean aprobadas y se generen los contratos y transferencias correspondientes.
        </Alert>
      ) : (
        <>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="documentos tabs">
              <Tab
                icon={<Description />}
                iconPosition="start"
                label={`Contratos (${contratosFiltrados.length})`}
                id="documentos-tab-0"
                aria-controls="documentos-tabpanel-0"
              />
              <Tab
                icon={<ReceiptLong />}
                iconPosition="start"
                label={`Comprobantes (${transferenciasFiltradas.length})`}
                id="documentos-tab-1"
                aria-controls="documentos-tabpanel-1"
              />
            </Tabs>
          </Box>

          {/* Contenido de las tabs */}
          <TabPanel value={tabValue} index={0}>
            {contratosFiltrados.length === 0 ? (
              <Alert severity="info">
                No tienes contratos disponibles.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>N° Contrato</TableCell>
                      <TableCell>Solicitud</TableCell>
                      <TableCell>Monto</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contratosFiltrados.map((contrato) => (
                      <TableRow key={contrato.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {contrato.numero_contrato || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {contrato.solicitud_numero || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatMonto(contrato.monto_solicitud || contrato.monto_aprobado, contrato.moneda_solicitud)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">
                            {contrato.created_at ? new Date(contrato.created_at).toLocaleDateString('es-ES') : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" gap={1} justifyContent="center">
                            <Tooltip title="Descargar contrato">
                              <IconButton
                                size="small"
                                onClick={() => handleDescargarContrato(contrato)}
                                disabled={!contrato.ruta_documento}
                                color="primary"
                              >
                                <Download />
                              </IconButton>
                            </Tooltip>

                            {contrato.firma_digital?.id && (
                              <Tooltip title="Ver contrato firmado">
                                <IconButton
                                  size="small"
                                  onClick={() => handleVerContratoFirmado(contrato.firma_digital.id)}
                                  color="success"
                                >
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {transferenciasFiltradas.length === 0 ? (
              <Alert severity="info">
                No tienes comprobantes de transferencia disponibles.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>N° Comprobante</TableCell>
                      <TableCell>Monto</TableCell>
                      <TableCell>Banco Destino</TableCell>
                      <TableCell>Cuenta Destino</TableCell>
                      <TableCell>Motivo</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Fecha de Transferencia</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transferenciasFiltradas.map((transferencia) => (
                      <TableRow key={transferencia.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {transferencia.numero_comprobante || 'Sin número'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {formatMonto(parseFloat(transferencia.monto), transferencia.moneda)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transferencia.banco_destino || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transferencia.cuenta_destino || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transferencia.motivo || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getEstadoIcon(transferencia.estado)}
                            label={transferencia.estado?.toUpperCase() || 'SIN ESTADO'}
                            color={getEstadoColor(transferencia.estado)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatFecha(transferencia.fecha_completada || transferencia.fecha_procesamiento)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" gap={1} justifyContent="center">
                            <Tooltip title="Descargar comprobante">
                              <IconButton
                                size="small"
                                onClick={() => handleDescargarComprobante(transferencia)}
                                disabled={!transferencia.ruta_comprobante || transferencia.estado !== 'completada'}
                                color="primary"
                              >
                                <Download />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Vista previa">
                              <IconButton
                                size="small"
                                onClick={() => handleVerVistaPrevia('comprobante', transferencia.id)}
                                disabled={!transferencia.ruta_comprobante || transferencia.estado !== 'completada'}
                                color="info"
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </>
      )}

      {/* Dialog para vista previa */}
      <Dialog
        open={vistaPreviaAbierta}
        onClose={() => setVistaPreviaAbierta(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, height: '80vh' }}>
          <iframe
            src={urlVistaPrevia}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="Vista previa del documento"
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
}