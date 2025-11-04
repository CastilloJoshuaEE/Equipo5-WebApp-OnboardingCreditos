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
  DialogTitle
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
    obtenerDocumentosStorage
  } = useDocumentos();

  useEffect(() => {
    cargarTodosLosDocumentos();
  }, []);

 // En frontend/components/DocumentosOperadorPage.jsx - corregir la función cargarTodosLosDocumentos
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
      
      // Formatear datos para la tabla - .
      const documentosFormateados = [
        // Contratos
...(data.data.contratos || []).map((contrato: any) => ({
          ...contrato,
          tipo: 'contrato',
          solicitante_nombre: contrato.solicitante_nombre || 'N/A',
          numero_solicitud: contrato.numero_solicitud || 'N/A',
          // Asegurar que los campos críticos existan
          estado: contrato.estado || 'desconocido',
          ruta_documento: contrato.ruta_documento || null
        })),
        
        // Transferencias
...(data.data.transferencias || []).map((transferencia: any) => ({
          ...transferencia,
          tipo: 'comprobante',
          solicitante_nombre: transferencia.solicitante_nombre || 'N/A',
          numero_solicitud: transferencia.numero_solicitud || 'N/A',
          // Asegurar que los campos críticos existan
          estado: transferencia.estado || 'desconocido',
          ruta_comprobante: transferencia.ruta_comprobante || null,
          banco_destino: transferencia.banco_destino || 'N/A'
        }))
      ];
      
      console.log('Documentos formateados:', documentosFormateados);
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
const handleDescargarContratoFirmado = async (firmaId: string) => {
    try {
        const session = await getSession();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        // Usar el nuevo endpoint específico para contrato firmado
        const response = await fetch(`${API_URL}/firmas/descargar-contrato-firmado/${firmaId}`, {
            headers: {
                'Authorization': `Bearer ${session?.accessToken}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            
            // Crear URL para descarga
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            // Obtener nombre del archivo del header o usar uno por defecto
            const contentDisposition = response.headers.get('content-disposition');
            let fileName = `contrato-firmado-${firmaId}.docx`;
            
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
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Error al descargar el contrato firmado');
        }
    } catch (error) {
        console.error('Error descargando contrato firmado:', error);
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
  const monedaValida = moneda && moneda.trim() !== '' ? moneda : 'USD'; // Moneda por defecto
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
            Gestión de documentos
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
              />
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
                    <TableCell>Fecha de última actualización</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
               <TableBody>
  {contratos.map((contrato) => {
    // 🔹 Corregir campo de solicitud
    const numeroSolicitud = contrato.numero_solicitud || contrato.id_solicitud || contrato.solicitud_id || '—';

    // 🔹 Manejar fecha segura
    const fechaValida = contrato.updated_at
      ? new Date(contrato.updated_at)
      : null;
    const fechaFormateada =
      fechaValida && !isNaN(fechaValida.getTime())
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
   

    {contrato.firma_digital?.id && (
      <Tooltip title="Descargar contrato firmado">
        <IconButton
          size="small"
          onClick={() => handleDescargarContratoFirmado(contrato.firma_digital.id)}
          color="success"
        >
          <CheckCircle />
        </IconButton>
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
  {comprobante.numero_solicitud || comprobante.solicitud_id || '—'}
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
  onClose={() => {
    setVistaPreviaAbierta(false);
    setUrlVistaPrevia('');
  }}
  maxWidth="lg"
  fullWidth
>
  <DialogContent sx={{ p: 0, position: 'relative', height: '80vh' }}>
    {/* ✅ Botón de cerrar arriba a la derecha */}
    <Box
      sx={{
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '50%',
      }}
    >
      <Tooltip title="Cerrar vista previa">
        <IconButton
          size="small"
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

    {/* ✅ Vista previa del documento */}
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