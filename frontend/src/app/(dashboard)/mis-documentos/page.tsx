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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
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
} from '@mui/icons-material';
import { useDocumentos } from '@/hooks/useDocumentos';
import { DocumentoContrato, ComprobanteTransferencia } from '@/services/documentos.service';
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

export default function MisDocumentosPage() {
  const [tabValue, setTabValue] = useState(0);
  const [solicitudesConDocumentos, setSolicitudesConDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistaPreviaAbierta, setVistaPreviaAbierta] = useState(false);
  const [urlVistaPrevia, setUrlVistaPrevia] = useState('');

  const {
    obtenerDocumentosContrato,
    obtenerComprobantes,
    descargarContrato,
    descargarComprobante,
    obtenerVistaPrevia,
  } = useDocumentos();

  useEffect(() => {
    cargarSolicitudesConDocumentos();
  }, []);

const cargarSolicitudesConDocumentos = async () => {
  try {
    setLoading(true);
    const session = await getSession();
    if (!session?.accessToken) {
      console.error('No se encontró token de sesión. Sesión inválida.');
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const response = await fetch(`${API_URL}/solicitudes/mis-solicitudes-con-documentos`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
      
      if (response.ok) {
        const data = await response.json();
        setSolicitudesConDocumentos(data.data || []);
      } else {
        throw new Error('Error al cargar solicitudes');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar documentos');
      console.error('Error cargando solicitudes:', err);
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
            Consulta y descarga tus documentos de contrato y comprobantes
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {solicitudesConDocumentos.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No tienes documentos disponibles en este momento. Los documentos aparecerán aquí 
          una vez que tus solicitudes sean aprobadas y se generen los contratos correspondientes.
        </Alert>
      ) : (
        <>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="documentos tabs">
              <Tab
                icon={<Description />}
                iconPosition="start"
                label="Contratos"
                id="documentos-tab-0"
                aria-controls="documentos-tabpanel-0"
              />
              <Tab
                icon={<ReceiptLong />}
                iconPosition="start"
                label="Comprobantes"
                id="documentos-tab-1"
                aria-controls="documentos-tabpanel-1"
              />
            </Tabs>
          </Box>

          {/* Contenido de las tabs */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {solicitudesConDocumentos.map((solicitud) => (
                solicitud.contratos?.map((contrato: any) => (
                 <Grid size={{ xs: 12}} key={contrato.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box>
                            <Typography variant="h6" component="h2">
                              Contrato: {contrato.numero_contrato}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Solicitud: {solicitud.numero_solicitud}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Monto: {formatMonto(solicitud.monto, solicitud.moneda)}
                            </Typography>
                          </Box>
                          <Chip
                            icon={getEstadoIcon(contrato.estado)}
                            label={contrato.estado.replace('_', ' ').toUpperCase()}
                            color={getEstadoColor(contrato.estado)}
                            variant="outlined"
                          />
                        </Box>

                        <Box display="flex" gap={2} mt={2}>
                          <Button
                            variant="contained"
                            startIcon={<Download />}
                            onClick={() => handleDescargarContrato(contrato)}
                            disabled={!contrato.ruta_documento}
                            size="small"
                          >
                            Descargar
                          </Button>

                          <Button
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => handleVerVistaPrevia('contrato', contrato.id)}
                            disabled={!contrato.ruta_documento}
                            size="small"
                          >
                            Vista Previa
                          </Button>

                          {contrato.firma_digital?.url_documento_firmado && (
                            <Tooltip title="Documento con firma digital aplicada">
                              <Button
                                variant="outlined"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() => window.open(contrato.firma_digital.url_documento_firmado, '_blank')}
                                size="small"
                              >
                                Ver Firmado
                              </Button>
                            </Tooltip>
                          )}
                        </Box>

                        {contrato.firma_digital?.fecha_firma_completa && (
                          <Box mt={2} p={1} bgcolor="success.light" borderRadius={1}>
                            <Typography variant="body2" color="success.dark">
                              ✅ Contrato completamente firmado el{' '}
                              {new Date(contrato.firma_digital.fecha_firma_completa).toLocaleDateString('es-ES')}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              {solicitudesConDocumentos.map((solicitud) => (
                solicitud.transferencias?.map((transferencia: any) => (
                          <Grid size={{ xs: 12}}  key={transferencia.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box>
                            <Typography variant="h6" component="h2">
                              Comprobante: {transferencia.numero_comprobante}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Solicitud: {solicitud.numero_solicitud}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Monto: {formatMonto(transferencia.monto, transferencia.moneda)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Cuenta: {transferencia.cuenta_destino} - {transferencia.banco_destino}
                            </Typography>
                          </Box>
                          <Chip
                            icon={getEstadoIcon(transferencia.estado)}
                            label={transferencia.estado.toUpperCase()}
                            color={getEstadoColor(transferencia.estado)}
                            size="small"
                          />
                        </Box>

                        <Box display="flex" gap={2} mt={2}>
                          <Button
                            variant="contained"
                            startIcon={<Download />}
                            onClick={() => handleDescargarComprobante(transferencia)}
                            disabled={!transferencia.ruta_comprobante}
                            size="small"
                          >
                            Descargar
                          </Button>

                          <Button
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => handleVerVistaPrevia('comprobante', transferencia.id)}
                            disabled={!transferencia.ruta_comprobante}
                            size="small"
                          >
                            Vista Previa
                          </Button>
                        </Box>

                        {transferencia.fecha_completada && (
                          <Box mt={2}>
                            <Typography variant="body2" color="text.secondary">
                              Transferencia completada: {new Date(transferencia.fecha_completada).toLocaleDateString('es-ES')}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ))}
            </Grid>
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