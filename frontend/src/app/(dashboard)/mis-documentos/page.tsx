// frontend/src/app/(dashboard)/mis-documentos/page.tsx
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
  DialogTitle,
  useTheme,
  useMediaQuery,
  Stack,
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
  Close,
} from '@mui/icons-material';
import { getSession } from 'next-auth/react';
import { TabPanelProps } from '@/components/ui/tab';
import { DocumentoTransferenciaBancaria } from '@/features/documentos/documentoTransferenciaBancaria.types';

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
      {value === index && <Box sx={{ py: { xs: 2, md: 3 } }}>{children}</Box>}
    </div>
  );
}

export default function MisDocumentosPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tabValue, setTabValue] = useState(0);
  const [solicitudesConDocumentos, setSolicitudesConDocumentos] = useState<any[]>([]);
  const [transferencias, setTransferencias] = useState<DocumentoTransferenciaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistaPreviaAbierta, setVistaPreviaAbierta] = useState(false);
  const [urlVistaPrevia, setUrlVistaPrevia] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [documentoCargando, setDocumentoCargando] = useState(false);

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
      
      const responseSolicitudes = await fetch(`${API_URL}/solicitudes/mis-solicitudes-con-documentos`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const responseTransferencias = await fetch(`${API_URL}/mis-transferencias`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (responseSolicitudes.ok && responseTransferencias.ok) {
        const dataSolicitudes = await responseSolicitudes.json();
        const dataTransferencias = await responseTransferencias.json();
        
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
      setDocumentoCargando(true);
      const session = await getSession();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
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
      setDocumentoCargando(false);
    }
  };

  const handleDescargarComprobante = async (transferencia: DocumentoTransferenciaBancaria) => {
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

  const handleCerrarVistaPrevia = () => {
    setVistaPreviaAbierta(false);
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
      case 'firmado':
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

  // Extraer y filtrar contratos completamente firmados
  const todosLosContratos = solicitudesConDocumentos.flatMap(solicitud => {
    const contratosSolicitud = Array.isArray(solicitud.contratos) 
      ? solicitud.contratos 
      : solicitud.contratos 
        ? [solicitud.contratos] 
        : [];

    return contratosSolicitud
      .filter(Boolean)
      .filter((contrato: any) => {
        const tieneFirmaCompleta = 
          contrato.firma_digital && 
          contrato.firma_digital.estado === 'firmado_completo';
        
        const contratoFirmado = 
          contrato.estado === 'firmado_completo' || 
          contrato.estado === 'vigente';

        return tieneFirmaCompleta || contratoFirmado;
      })
      .map((contrato: any) => ({
        ...contrato,
        solicitud_numero: solicitud.numero_solicitud,
        monto_solicitud: solicitud.monto,
        moneda_solicitud: solicitud.moneda,
        firma_digital: contrato.firma_digital || contrato.firmas_digitales?.[0] || null
      }));
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

  // Componente para tarjetas responsive de contratos
  const ContratoCard = ({ contrato }: { contrato: any }) => (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              N° Contrato
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {contrato.numero_contrato || '—'}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Solicitud
            </Typography>
            <Typography variant="body1">
              {contrato.solicitud_numero || '—'}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Monto
            </Typography>
            <Typography variant="body1">
              {formatMonto(contrato.monto_solicitud || contrato.monto_aprobado, contrato.moneda_solicitud)}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Fecha
            </Typography>
            <Typography variant="body1">
              {contrato.created_at ? new Date(contrato.created_at).toLocaleDateString('es-ES') : '—'}
            </Typography>
          </Box>
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
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

            {contrato.firma_digital && (
              <Chip 
                size="small" 
                label={contrato.firma_digital.estado === 'firmado_completo' ? 'FIRMADO' : 'PENDIENTE'}
                color={contrato.firma_digital.estado === 'firmado_completo' ? 'success' : 'warning'}
                variant="outlined"
              />
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  // Componente para tarjetas responsive de transferencias
  const TransferenciaCard = ({ transferencia }: { transferencia: DocumentoTransferenciaBancaria }) => (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              N° Comprobante
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {transferencia.numero_comprobante || 'Sin número'}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Monto
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatMonto(parseFloat(transferencia.monto), transferencia.moneda)}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Banco Destino
            </Typography>
            <Typography variant="body1">
              {transferencia.banco_destino || '—'}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Cuenta Destino
            </Typography>
            <Typography variant="body1">
              {transferencia.cuenta_destino || '—'}
            </Typography>
          </Box>
          
          {!isSmallMobile && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Motivo
              </Typography>
              <Typography variant="body1">
                {transferencia.motivo || '—'}
              </Typography>
            </Box>
          )}
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Estado
            </Typography>
            <Chip
              icon={getEstadoIcon(transferencia.estado)}
              label={transferencia.estado?.toUpperCase() || 'SIN ESTADO'}
              color={getEstadoColor(transferencia.estado)}
              size="small"
            />
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Fecha
            </Typography>
            <Typography variant="body1">
              {formatFecha(transferencia.fecha_completada || transferencia.fecha_procesamiento)}
            </Typography>
          </Box>
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
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
        </Stack>
      </CardContent>
    </Card>
  );

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
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        alignItems={{ xs: 'flex-start', sm: 'center' }} 
        spacing={2} 
        mb={4}
      >
        <Description sx={{ fontSize: { xs: 32, md: 40 }, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" component="h1" fontSize={{ xs: '1.75rem', md: '2.125rem' }}>
            Mis documentos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Consulta y descarga tus contratos y comprobantes de transferencia
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filtro de búsqueda */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
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
              size={isMobile ? "small" : "medium"}
            />
            <Typography variant="body2" color="text.secondary">
              {contratosFiltrados.length + transferenciasFiltradas.length} documentos encontrados
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {solicitudesConDocumentos.length === 0 && transferencias.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No tienes documentos disponibles en este momento. Los documentos aparecerán aquí 
          una vez que tus solicitudes sean aprobadas y se generen los contratos y transferencias correspondientes.
        </Alert>
      ) : (
        <>
          {/* Tabs responsive */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="documentos tabs"
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
            >
              <Tab
                icon={<Description />}
                iconPosition="start"
                label={isSmallMobile ? `Contratos` : `Contratos (${contratosFiltrados.length})`}
                id="documentos-tab-0"
                aria-controls="documentos-tabpanel-0"
                sx={{ minHeight: { xs: 48, sm: 64 } }}
              />
              <Tab
                icon={<ReceiptLong />}
                iconPosition="start"
                label={isSmallMobile ? `Comprobantes` : `Comprobantes (${transferenciasFiltradas.length})`}
                id="documentos-tab-1"
                aria-controls="documentos-tabpanel-1"
                sx={{ minHeight: { xs: 48, sm: 64 } }}
              />
            </Tabs>
          </Box>

          {/* Contenido de las tabs */}
          <TabPanel value={tabValue} index={0}>
            {contratosFiltrados.length === 0 ? (
              <Alert severity="info">
                No tienes contratos disponibles.
              </Alert>
            ) : isMobile ? (
              // Vista de tarjetas para móviles
              <Stack spacing={2}>
                {contratosFiltrados.map((contrato) => (
                  <ContratoCard key={contrato.id} contrato={contrato} />
                ))}
              </Stack>
            ) : (
              // Vista de tabla para desktop
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
            ) : isMobile ? (
              // Vista de tarjetas para móviles
              <Stack spacing={2}>
                {transferenciasFiltradas.map((transferencia) => (
                  <TransferenciaCard key={transferencia.id} transferencia={transferencia} />
                ))}
              </Stack>
            ) : (
              // Vista de tabla para desktop
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>N° Comprobante</TableCell>
                      <TableCell>Monto</TableCell>
                      <TableCell>Banco Destino</TableCell>
                      <TableCell>Cuenta Destino</TableCell>
                      {!isSmallMobile && <TableCell>Motivo</TableCell>}
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
                        {!isSmallMobile && (
                          <TableCell>
                            <Typography variant="body2">
                              {transferencia.motivo || '—'}
                            </Typography>
                          </TableCell>
                        )}
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

      {/* Dialog para vista previa - Mejorado para responsive */}
      <Dialog
        open={vistaPreviaAbierta}
        onClose={handleCerrarVistaPrevia}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        sx={{
          '& .MuiDialog-paper': {
            height: isMobile ? '100vh' : '90vh',
            maxHeight: 'none'
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
          <Typography variant="h6" component="div" fontSize={{ xs: '1rem', md: '1.25rem' }}>
            Vista previa del documento
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
        
        <DialogContent sx={{ p: 0, height: isMobile ? 'calc(100% - 64px)' : 'calc(100% - 64px)' }}>
          {documentoCargando ? (
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              height="100%"
              flexDirection="column"
            >
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Cargando documento...
              </Typography>
            </Box>
          ) : urlVistaPrevia ? (
            <iframe
              src={urlVistaPrevia}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title="Vista previa del documento"
              onLoad={() => setDocumentoCargando(false)}
            />
          ) : (
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