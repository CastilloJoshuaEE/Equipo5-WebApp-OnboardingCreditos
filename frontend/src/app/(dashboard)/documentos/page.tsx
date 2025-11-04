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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  FilterList,
  Close
} from '@mui/icons-material';
import { useDocumentos } from '@/hooks/useDocumentos';
import { getSession } from 'next-auth/react';

// Interfaces TypeScript para los tipos de datos
interface FirmaDigital {
  id: string;
  estado: string;
  fecha_firma_completa: string;
  url_documento_firmado: string;
  ruta_documento: string;
  integridad_valida: boolean;
}

interface Contrato {
  id: string;
  tipo: string;
  numero_contrato: string;
  estado: string;
  ruta_documento: string;
  monto: number;
  moneda: string;
  created_at: string;
  updated_at: string;
  numero_solicitud: string;
  solicitante_nombre: string;
  firma_digital?: FirmaDigital;
  tiene_documento_firmado?: boolean;
  url_documento_firmado?: string;
  firma_id?: string;
}

interface Transferencia {
  id: string;
  tipo: string;
  numero_comprobante: string;
  estado: string;
  ruta_comprobante: string;
  monto: number;
  moneda: string;
  fecha_procesamiento: string;
  fecha_completada: string;
  banco_destino: string;
  cuenta_destino: string;
  numero_solicitud: string;
  solicitante_nombre: string;
  contacto_bancario?: any;
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
      {value === index && <Box sx={{ py: { xs: 2, md: 3 } }}>{children}</Box>}
    </div>
  );
}

export default function DocumentosOperadorPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tabValue, setTabValue] = useState(0);
  const [documentos, setDocumentos] = useState<(Contrato | Transferencia)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistaPreviaAbierta, setVistaPreviaAbierta] = useState(false);
  const [urlVistaPrevia, setUrlVistaPrevia] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const {
    obtenerDocumentosContrato,
    obtenerComprobantes,
    descargarContrato,
    descargarComprobante,
    obtenerVistaPrevia,
    obtenerDocumentosStorage
  } = useDocumentos();

  useEffect(() => {
    cargarTodosLosDocumentos();
  }, []);

  const cargarTodosLosDocumentos = async () => {
    try {
      setLoading(true);
      const session = await getSession();
      if (!session?.accessToken) {
        console.error('No se encontró token de sesión');
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/operador/todos-los-documentos`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        const documentosFormateados: (Contrato | Transferencia)[] = [
          ...(data.data.contratos || []).map((contrato: any): Contrato => ({
            ...contrato,
            tipo: 'contrato',
            solicitante_nombre: contrato.solicitante_nombre || 'N/A',
            numero_solicitud: contrato.numero_solicitud || 'N/A',
            estado: contrato.estado || 'desconocido',
            ruta_documento: contrato.ruta_documento || null,
            monto: contrato.monto || 0,
            moneda: contrato.moneda || 'USD',
            tiene_documento_firmado: contrato.tiene_documento_firmado || false,
            url_documento_firmado: contrato.url_documento_firmado || null,
            firma_id: contrato.firma_id || null
          })),
          
          ...(data.data.transferencias || []).map((transferencia: any): Transferencia => ({
            ...transferencia,
            tipo: 'comprobante',
            solicitante_nombre: transferencia.solicitante_nombre || 'N/A',
            numero_solicitud: transferencia.numero_solicitud || 'N/A',
            estado: transferencia.estado || 'desconocido',
            ruta_comprobante: transferencia.ruta_comprobante || null,
            banco_destino: transferencia.banco_destino || 'N/A',
            monto: transferencia.monto || 0,
            moneda: transferencia.moneda || 'USD'
          }))
        ];
        
        setDocumentos(documentosFormateados);
      } else {
        const errorData = await response.json();
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

  const handleDescargarComprobante = async (comprobante: Transferencia) => {
    try {
      await descargarComprobante(
        comprobante.id,
        comprobante.numero_comprobante
      );
    } catch (err) {
      console.error('Error descargando comprobante:', err);
    }
  };

  const handleVerVistaPrevia = async (tipo: 'contrato' | 'comprobante', id: string) => {
    try {
      const vistaPrevia = await obtenerVistaPrevia(tipo, id);
      setUrlVistaPrevia(vistaPrevia.url);
      setVistaPreviaAbierta(true);
    } catch (err) {
      console.error('Error obteniendo vista previa:', err);
    }
  };

  const handleDescargarContratoFirmado = async (contrato: Contrato) => {
    try {
        const session = await getSession();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        if (!contrato.firma_digital || contrato.firma_digital.estado !== 'firmado_completo') {
            alert('El contrato no está completamente firmado. No se puede descargar.');
            return;
        }

        if (!contrato.firma_digital.url_documento_firmado) {
            alert('No hay documento firmado disponible para descargar.');
            return;
        }

        console.log('📥 Descargando contrato firmado:', contrato.firma_digital.id);
        
        const response = await fetch(`${API_URL}/firmas/descargar-contrato-firmado/${contrato.firma_digital.id}`, {
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
            
            const contentDisposition = response.headers.get('content-disposition');
            let fileName = `contrato-firmado-${contrato.numero_contrato}.docx`;
            
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch) {
                    fileName = fileNameMatch[1];
                }
            }
            
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            console.log('. Contrato firmado descargado exitosamente');
        } else {
            const errorData = await response.json();
            console.error('. Error descargando contrato:', errorData);
            alert(errorData.message || 'Error al descargar el contrato firmado');
        }
    } catch (error) {
        console.error('. Error de conexión:', error);
        alert('Error de conexión al descargar contrato firmado');
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'firmado_completo':
      case 'vigente':
      case 'completada':
        return 'success';
      case 'pendiente_firma':
      case 'generado':
      case 'procesando':
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
    switch (estado) {
      case 'firmado_completo':
      case 'vigente':
      case 'completada':
        return <CheckCircle />;
      case 'pendiente_firma':
      case 'generado':
      case 'procesando':
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

  // Filtrar documentos según los filtros aplicados
  const documentosFiltrados = documentos.filter(doc => {
    const coincideBusqueda = 
      doc.numero_solicitud?.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      (doc.tipo === 'contrato' && (doc as Contrato).numero_contrato?.toLowerCase().includes(filtroBusqueda.toLowerCase())) ||
      (doc.tipo === 'comprobante' && (doc as Transferencia).numero_comprobante?.toLowerCase().includes(filtroBusqueda.toLowerCase())) ||
      doc.solicitante_nombre?.toLowerCase().includes(filtroBusqueda.toLowerCase());

    const coincideEstado = 
      filtroEstado === 'todos' || 
      doc.estado === filtroEstado;

    return coincideBusqueda && coincideEstado;
  });

  // Filtrar por tipo con Type Guards
  const contratos = documentosFiltrados.filter((doc): doc is Contrato => doc.tipo === 'contrato');
  const comprobantes = documentosFiltrados.filter((doc): doc is Transferencia => doc.tipo === 'comprobante');

  // Componente para tarjetas responsive de contratos
  const ContratoCard = ({ contrato }: { contrato: Contrato }) => {
    const numeroSolicitud = contrato.numero_solicitud || '—';
    const fechaValida = contrato.updated_at ? new Date(contrato.updated_at) : null;
    const fechaFormateada = fechaValida && !isNaN(fechaValida.getTime())
      ? fechaValida.toLocaleDateString('es-ES')
      : 'Sin fecha';

    return (
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
              <Typography variant="body1">{numeroSolicitud}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Solicitante
              </Typography>
              <Typography variant="body1">
                {contrato.solicitante_nombre || '—'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Fecha de actualización
              </Typography>
              <Typography variant="body2">{fechaFormateada}</Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              {contrato.firma_digital?.estado === 'firmado_completo' && (
                <Tooltip title="Descargar contrato firmado">
                  <IconButton
                    size="small"
                    onClick={() => handleDescargarContratoFirmado(contrato)}
                    color="success"
                  >
                    <Download />
                  </IconButton>
                </Tooltip>
              )}
              
              {contrato.firma_digital && (
                <Chip 
                  size="small" 
                  label={contrato.firma_digital.estado === 'firmado_completo' ? 'FIRMADO' : contrato.firma_digital.estado.toUpperCase()}
                  color={contrato.firma_digital.estado === 'firmado_completo' ? 'success' : 'warning'}
                  variant="outlined"
                />
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  // Componente para tarjetas responsive de comprobantes
  const ComprobanteCard = ({ comprobante }: { comprobante: Transferencia }) => (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              N° Comprobante
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {comprobante.numero_comprobante}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Solicitud
            </Typography>
            <Typography variant="body1">
              {comprobante.numero_solicitud || '—'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Solicitante
            </Typography>
            <Typography variant="body1">
              {comprobante.solicitante_nombre}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Monto
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatMonto(comprobante.monto, comprobante.moneda)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Banco Destino
            </Typography>
            <Typography variant="body2">
              {comprobante.banco_destino}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Estado
            </Typography>
            <Chip
              icon={getEstadoIcon(comprobante.estado)}
              label={comprobante.estado.toUpperCase()}
              color={getEstadoColor(comprobante.estado)}
              size="small"
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Fecha
            </Typography>
            <Typography variant="body2">
              {new Date(comprobante.fecha_procesamiento).toLocaleDateString('es-ES')}
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Tooltip title="Descargar comprobante">
              <IconButton
                size="small"
                onClick={() => handleDescargarComprobante(comprobante)}
                disabled={!comprobante.ruta_comprobante}
                color="primary"
              >
                <Download />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Vista previa">
              <IconButton
                size="small"
                onClick={() => handleVerVistaPrevia('comprobante', comprobante.id)}
                disabled={!comprobante.ruta_comprobante}
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
      {/* Header Responsive */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        alignItems={{ xs: 'flex-start', sm: 'center' }} 
        spacing={2} 
        mb={4}
      >
        <Description sx={{ fontSize: { xs: 32, md: 40 }, color: 'primary.main' }} />
        <Box>
          <Typography 
            variant="h4" 
            component="h1"
            fontSize={{ xs: '1.75rem', md: '2.125rem' }}
          >
            Gestión de documentos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra y revisa todos los documentos del sistema
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filtros Responsive */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              fullWidth
              placeholder="Buscar por número de contrato, comprobante o nombre del solicitante..."
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
            
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {documentosFiltrados.length} documentos encontrados
              </Typography>
              
              {!isSmallMobile && (
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filtroEstado}
                    label="Estado"
                    onChange={(e) => setFiltroEstado(e.target.value)}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    <MenuItem value="firmado_completo">Firmado</MenuItem>
                    <MenuItem value="pendiente_firma">Pendiente</MenuItem>
                    <MenuItem value="completada">Completada</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {documentos.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No hay documentos disponibles en el sistema en este momento.
        </Alert>
      ) : (
        <>
          {/* Tabs Responsive */}
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
                label={isSmallMobile ? `Contratos` : `Contratos (${contratos.length})`}
                id="documentos-tab-0"
                aria-controls="documentos-tabpanel-0"
                sx={{ minHeight: { xs: 48, sm: 64 } }}
              />
              <Tab
                icon={<ReceiptLong />}
                iconPosition="start"
                label={isSmallMobile ? `Comprobantes` : `Comprobantes (${comprobantes.length})`}
                id="documentos-tab-1"
                aria-controls="documentos-tabpanel-1"
                sx={{ minHeight: { xs: 48, sm: 64 } }}
              />
            </Tabs>
          </Box>

          {/* Contenido de las tabs - Responsive */}
          <TabPanel value={tabValue} index={0}>
            {contratos.length === 0 ? (
              <Alert severity="info">
                No hay contratos que coincidan con los filtros aplicados.
              </Alert>
            ) : isMobile ? (
              // Vista de tarjetas para móviles
              <Stack spacing={2}>
                {contratos.map((contrato) => (
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
                      <TableCell>Solicitante</TableCell>
                      <TableCell>Fecha de última actualización</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contratos.map((contrato) => {
                      const numeroSolicitud = contrato.numero_solicitud || '—';
                      const fechaValida = contrato.updated_at ? new Date(contrato.updated_at) : null;
                      const fechaFormateada = fechaValida && !isNaN(fechaValida.getTime())
                        ? fechaValida.toLocaleDateString('es-ES')
                        : 'Sin fecha';

                      return (
                        <TableRow key={contrato.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {contrato.numero_contrato || '—'}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2">{numeroSolicitud}</Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2">
                              {contrato.solicitante_nombre || '—'}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2">{fechaFormateada}</Typography>
                          </TableCell>

                          <TableCell align="center">
                            <Box display="flex" gap={1} justifyContent="center">
                              {contrato.firma_digital?.estado === 'firmado_completo' && (
                                <Tooltip title="Descargar contrato firmado">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDescargarContratoFirmado(contrato)}
                                    color="success"
                                  >
                                    <Download />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              {contrato.firma_digital && (
                                <Tooltip title={`Estado: ${contrato.firma_digital.estado}`}>
                                  <Chip 
                                    size="small" 
                                    label={contrato.firma_digital.estado === 'firmado_completo' ? 'FIRMADO' : contrato.firma_digital.estado.toUpperCase()}
                                    color={contrato.firma_digital.estado === 'firmado_completo' ? 'success' : 'warning'}
                                    variant="outlined"
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {comprobantes.length === 0 ? (
              <Alert severity="info">
                No hay comprobantes que coincidan con los filtros aplicados.
              </Alert>
            ) : isMobile ? (
              // Vista de tarjetas para móviles
              <Stack spacing={2}>
                {comprobantes.map((comprobante) => (
                  <ComprobanteCard key={comprobante.id} comprobante={comprobante} />
                ))}
              </Stack>
            ) : (
              // Vista de tabla para desktop
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>N° Comprobante</TableCell>
                      <TableCell>Solicitud</TableCell>
                      <TableCell>Solicitante</TableCell>
                      <TableCell>Monto</TableCell>
                      {!isSmallMobile && <TableCell>Banco Destino</TableCell>}
                      <TableCell>Estado</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comprobantes.map((comprobante) => (
                      <TableRow key={comprobante.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {comprobante.numero_comprobante}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {comprobante.numero_solicitud || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {comprobante.solicitante_nombre}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {formatMonto(comprobante.monto, comprobante.moneda)}
                          </Typography>
                        </TableCell>
                        {!isSmallMobile && (
                          <TableCell>
                            <Typography variant="body2">
                              {comprobante.banco_destino}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell>
                          <Chip
                            icon={getEstadoIcon(comprobante.estado)}
                            label={comprobante.estado.toUpperCase()}
                            color={getEstadoColor(comprobante.estado)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(comprobante.fecha_procesamiento).toLocaleDateString('es-ES')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" gap={1} justifyContent="center">
                            <Tooltip title="Descargar comprobante">
                              <IconButton
                                size="small"
                                onClick={() => handleDescargarComprobante(comprobante)}
                                disabled={!comprobante.ruta_comprobante}
                                color="primary"
                              >
                                <Download />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Vista previa">
                              <IconButton
                                size="small"
                                onClick={() => handleVerVistaPrevia('comprobante', comprobante.id)}
                                disabled={!comprobante.ruta_comprobante}
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

      {/* Dialog para vista previa - Responsive */}
      <Dialog
        open={vistaPreviaAbierta}
        onClose={() => {
          setVistaPreviaAbierta(false);
          setUrlVistaPrevia('');
        }}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        sx={{
          '& .MuiDialog-paper': {
            height: isMobile ? '100vh' : '80vh',
            maxHeight: 'none'
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative', height: '100%' }}>
          {/* Botón de cerrar mejorado para responsive */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '50%',
              boxShadow: 1,
            }}
          >
            <Tooltip title="Cerrar vista previa">
              <IconButton
                size={isMobile ? "medium" : "small"}
                color="error"
                onClick={() => {
                  setVistaPreviaAbierta(false);
                  setUrlVistaPrevia('');
                }}
              >
                <Close />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Vista previa del documento */}
          {urlVistaPrevia ? (
            <iframe
              src={urlVistaPrevia}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title="Vista previa del comprobante"
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