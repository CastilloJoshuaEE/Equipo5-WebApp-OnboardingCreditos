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
} from '@mui/icons-material';
import { useDocumentos } from '@/hooks/useDocumentos';
import { getSession } from 'next-auth/react';
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

export default function DocumentosOperadorPage() {
  const [tabValue, setTabValue] = useState(0);
  const [documentos, setDocumentos] = useState<any[]>([]);
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
  } = useDocumentos();

  useEffect(() => {
    cargarTodosLosDocumentos();
  }, []);

  const cargarTodosLosDocumentos = async () => {
    try {
    setLoading(true);
    const session = await getSession();
    if (!session?.accessToken) {
      console.error('No se encontró token de sesión. Sesión inválida.');
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
        setDocumentos(data.data || []);
      } else {
        throw new Error('Error al cargar documentos');
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

  const handleDescargarContrato = async (contrato: any) => {
    try {
      await descargarContrato(
        contrato.id,
        `contrato-${contrato.numero_contrato}.docx`
      );
    } catch (err) {
      console.error('Error descargando contrato:', err);
    }
  };

  const handleDescargarComprobante = async (comprobante: any) => {
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

  const formatMonto = (monto: number, moneda: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: moneda,
    }).format(monto);
  };

  // Filtrar documentos según los filtros aplicados
  const documentosFiltrados = documentos.filter(doc => {
    const coincideBusqueda = 
      doc.numero_solicitud?.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      doc.numero_contrato?.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      doc.numero_comprobante?.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      doc.solicitante_nombre?.toLowerCase().includes(filtroBusqueda.toLowerCase());

    const coincideEstado = 
      filtroEstado === 'todos' || 
      doc.estado === filtroEstado;

    return coincideBusqueda && coincideEstado;
  });

  const contratos = documentosFiltrados.filter(doc => doc.tipo === 'contrato');
  const comprobantes = documentosFiltrados.filter(doc => doc.tipo === 'comprobante');

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
            Gestión de Documentos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra y revisa todos los documentos del sistema
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 6}}>
              <TextField
                fullWidth
                placeholder="Buscar por número de solicitud, contrato, comprobante o solicitante..."
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
                <Grid size={{ xs: 12, md: 3}}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtroEstado}
                  label="Estado"
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterList />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="todos">Todos los estados</MenuItem>
                  <MenuItem value="firmado_completo">Firmado completo</MenuItem>
                  <MenuItem value="vigente">Vigente</MenuItem>
                  <MenuItem value="pendiente_firma">Pendiente de firma</MenuItem>
                  <MenuItem value="generado">Generado</MenuItem>
                  <MenuItem value="completada">Completada</MenuItem>
                  <MenuItem value="procesando">Procesando</MenuItem>
                </Select>
              </FormControl>
            </Grid>
                <Grid size={{ xs: 12, md: 3}}>
              <Typography variant="body2" color="text.secondary">
                {documentosFiltrados.length} documentos encontrados
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {documentos.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No hay documentos disponibles en el sistema en este momento.
        </Alert>
      ) : (
        <>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="documentos tabs">
              <Tab
                icon={<Description />}
                iconPosition="start"
                label={`Contratos (${contratos.length})`}
                id="documentos-tab-0"
                aria-controls="documentos-tabpanel-0"
              />
              <Tab
                icon={<ReceiptLong />}
                iconPosition="start"
                label={`Comprobantes (${comprobantes.length})`}
                id="documentos-tab-1"
                aria-controls="documentos-tabpanel-1"
              />
            </Tabs>
          </Box>

          {/* Contenido de las tabs */}
          <TabPanel value={tabValue} index={0}>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>N° Contrato</TableCell>
                    <TableCell>Solicitud</TableCell>
                    <TableCell>Solicitante</TableCell>
                    <TableCell>Monto</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contratos.map((contrato) => (
                    <TableRow key={contrato.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {contrato.numero_contrato}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {contrato.numero_solicitud}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {contrato.solicitante_nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatMonto(contrato.monto, contrato.moneda)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getEstadoIcon(contrato.estado)}
                          label={contrato.estado.replace('_', ' ').toUpperCase()}
                          color={getEstadoColor(contrato.estado)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(contrato.fecha_creacion).toLocaleDateString('es-ES')}
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
                          
                          <Tooltip title="Vista previa">
                            <IconButton
                              size="small"
                              onClick={() => handleVerVistaPrevia('contrato', contrato.id)}
                              disabled={!contrato.ruta_documento}
                              color="info"
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>

                          {contrato.firma_digital?.url_documento_firmado && (
                            <Tooltip title="Ver documento firmado">
                              <IconButton
                                size="small"
                                onClick={() => window.open(contrato.firma_digital.url_documento_firmado, '_blank')}
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
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>N° Comprobante</TableCell>
                    <TableCell>Solicitud</TableCell>
                    <TableCell>Solicitante</TableCell>
                    <TableCell>Monto</TableCell>
                    <TableCell>Banco Destino</TableCell>
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
                          {comprobante.numero_solicitud}
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
                      <TableCell>
                        <Typography variant="body2">
                          {comprobante.banco_destino}
                        </Typography>
                      </TableCell>
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