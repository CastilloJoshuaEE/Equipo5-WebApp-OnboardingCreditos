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
  DialogTitle, // Agregado
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
  Close, // Agregado
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
  const [documentoCargando, setDocumentoCargando] = useState(false); // Nuevo estado para carga

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

  const handleVerContrato = async (contrato: any) => {
    try {
        setDocumentoCargando(true); // Iniciar carga
        const session = await getSession();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        // Si tiene firma digital y está firmado, mostrar el firmado
        if (contrato.firma_digital) {
            const response = await fetch(
                `${API_URL}/firmas/ver-contrato-firmado/${contrato.firma_digital.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${session?.accessToken}`
                    }
                }
            );

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                setUrlVistaPrevia(url);
                setVistaPreviaAbierta(true);
            } else {
                alert('Error al cargar el contrato');
            }
        }        
    } catch (error) {
        console.error('Error viendo contrato:', error);
        alert('Error al cargar el contrato');
    } finally {
        setDocumentoCargando(false); // Finalizar carga
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

  const handleVerVistaPrevia = async (tipo: 'comprobante', id: string) => {
    try {
      setDocumentoCargando(true);
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
    } finally {
      setDocumentoCargando(false);
    }
  };

  // Función para cerrar la vista previa y limpiar la URL
  const handleCerrarVistaPrevia = () => {
    setVistaPreviaAbierta(false);
    // Limpiar la URL para liberar memoria
    if (urlVistaPrevia) {
      window.URL.revokeObjectURL(urlVistaPrevia);
      setUrlVistaPrevia('');
    }
  };

const getEstadoColor = (estado: string) => {
  switch (estado?.toLowerCase()) {
    case 'firmado_completo':
    case 'vigente':
    case 'completada':
    case 'aprobado':
    case 'firmado': // Agregar este caso
      return 'success';
    case 'pendiente_firma':
    case 'generado':
    case 'processando':
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

// CORRECCIÓN: Extraer y filtrar contratos completamente firmados
const todosLosContratos = solicitudesConDocumentos.flatMap(solicitud => {
  const contratosSolicitud = Array.isArray(solicitud.contratos) 
    ? solicitud.contratos 
    : solicitud.contratos 
      ? [solicitud.contratos] 
      : [];

  return contratosSolicitud
    .filter(Boolean)
    // . FILTRO CORREGIDO: Mostrar contratos que estén completamente firmados
    .filter((contrato: any) => {
      // Verificar si tiene firma digital con estado 'firmado_completo'
      const tieneFirmaCompleta = 
        contrato.firma_digital && 
        contrato.firma_digital.estado === 'firmado_completo';
      
      // También verificar si el contrato mismo está marcado como firmado
      const contratoFirmado = 
        contrato.estado === 'firmado_completo' || 
        contrato.estado === 'vigente';

      console.log(`📋 Contrato ${contrato.numero_contrato}:`, {
        tieneFirmaCompleta,
        contratoFirmado,
        estadoFirma: contrato.firma_digital?.estado,
        estadoContrato: contrato.estado
      });

      return tieneFirmaCompleta || contratoFirmado;
    })
    .map((contrato: any) => ({
      ...contrato,
      solicitud_numero: solicitud.numero_solicitud,
      monto_solicitud: solicitud.monto,
      moneda_solicitud: solicitud.moneda,
      // Asegurar que firma_digital esté disponible
      firma_digital: contrato.firma_digital || contrato.firmas_digitales?.[0] || null
    }));
});

console.log(`. Contratos completamente firmados encontrados: ${todosLosContratos.length}`);
todosLosContratos.forEach(contrato => {
  console.log(`. Contrato firmado: ${contrato.numero_contrato}`, {
    estado: contrato.estado,
    estadoFirma: contrato.firma_digital?.estado,
    tieneFirmaDigital: !!contrato.firma_digital
  });
});

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
            Mis documentos
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
    {/* Botón para ver el contrato FIRMADO si existe, sino el original */}
    <Tooltip title="Ver documento">
      <IconButton
        size="small"
        onClick={() => handleVerContrato(contrato)}
        color="primary"
        disabled={documentoCargando}
      >
        <Visibility />
      </IconButton>
    </Tooltip>

    {/* Indicador de estado */}
    {contrato.firma_digital && (
      <Tooltip title={`Estado de firma: ${contrato.firma_digital.estado}`}>
        <Chip 
          size="small" 
          label={contrato.firma_digital.estado === 'firmado_completo' ? 'FIRMADO' : 'PENDIENTE'}
          color={contrato.firma_digital.estado === 'firmado_completo' ? 'success' : 'warning'}
          variant="outlined"
        />
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
                                disabled={!transferencia.ruta_comprobante || transferencia.estado !== 'completada' || documentoCargando}
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

      {/* Dialog para vista previa - CON BOTÓN DE CERRAR */}
      <Dialog
        open={vistaPreviaAbierta}
        onClose={handleCerrarVistaPrevia}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '90vh'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            m: 0, 
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'primary.main',
            color: 'white'
          }}
        >
          <Typography variant="h6" component="div">
            . Vista previa del documento
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleCerrarVistaPrevia}
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, height: 'calc(100% - 64px)' }}>
  {documentoCargando ? (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      height="100%"
    >
      <CircularProgress />
      <Typography variant="body1" sx={{ ml: 2 }}>
        Cargando documento...
      </Typography>
    </Box>
  ) : urlVistaPrevia ? (
    // . Solo renderizar el iframe si hay una URL válida
    <iframe
      src={urlVistaPrevia}
      width="100%"
      height="100%"
      style={{ border: 'none' }}
      title="Vista previa del documento"
      onLoad={() => setDocumentoCargando(false)}
    />
  ) : (
    // . Mostrar mensaje en caso de que la URL esté vacía
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      height="100%"
      flexDirection="column"
    >
      <Description sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
      <Typography variant="body2" color="text.secondary">
        No hay documento disponible para vista previa.
      </Typography>
    </Box>
  )}
</DialogContent>

      </Dialog>
    </Container>
  );
}