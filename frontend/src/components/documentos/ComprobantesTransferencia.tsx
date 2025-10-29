// frontend/src/components/documentos/ComprobantesTransferencia.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Grid,
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
  Download,
  Visibility,
  Receipt,
  CheckCircle,
  Schedule,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useDocumentos } from '@/hooks/useDocumentos';
import { ComprobanteTransferencia } from '@/services/documentos.service';

interface ComprobantesTransferenciaProps {
  solicitudId: string;
}

export const ComprobantesTransferencia: React.FC<ComprobantesTransferenciaProps> = ({ solicitudId }) => {
  const {
    loading,
    error,
    obtenerComprobantes,
    descargarComprobante,
    obtenerVistaPrevia,
  } = useDocumentos();

  const [comprobantes, setComprobantes] = useState<ComprobanteTransferencia[]>([]);
  const [vistaPreviaAbierta, setVistaPreviaAbierta] = useState(false);
  const [urlVistaPrevia, setUrlVistaPrevia] = useState('');

  useEffect(() => {
    cargarComprobantes();
  }, [solicitudId]);

  const cargarComprobantes = async () => {
    try {
      const data = await obtenerComprobantes(solicitudId);
      setComprobantes(data);
    } catch (err) {
      console.error('Error cargando comprobantes:', err);
    }
  };

  const handleDescargarComprobante = async (transferencia: ComprobanteTransferencia) => {
    try {
      await descargarComprobante(
        transferencia.id,
        transferencia.numero_comprobante
      );
    } catch (err) {
      console.error('Error descargando comprobante:', err);
    }
  };

  const handleVerVistaPrevia = async (transferenciaId: string) => {
    try {
      const vistaPrevia = await obtenerVistaPrevia('comprobante', transferenciaId);
      setUrlVistaPrevia(vistaPrevia.url);
      setVistaPreviaAbierta(true);
    } catch (err) {
      console.error('Error obteniendo vista previa:', err);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completada':
        return 'success';
      case 'pendiente':
      case 'procesando':
        return 'warning';
      case 'fallida':
      case 'reversada':
        return 'error';
      default:
        return 'default';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'completada':
        return <CheckCircle />;
      case 'pendiente':
      case 'procesando':
        return <Schedule />;
      case 'fallida':
      case 'reversada':
        return <ErrorIcon />;
      default:
        return <Receipt />;
    }
  };

  const formatMonto = (monto: number, moneda: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: moneda,
    }).format(monto);
  };

  if (loading && comprobantes.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && comprobantes.length === 0) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (comprobantes.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No se encontraron comprobantes de transferencia para esta solicitud.
      </Alert>
    );
  }

  return (
    <Box>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" component="h2" mb={3}>
            💰 Comprobantes de Transferencia
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>N° Comprobante</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>Banco Destino</TableCell>
                  <TableCell>Cuenta</TableCell>
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
                      <Typography variant="body2" fontWeight="medium">
                        {formatMonto(comprobante.monto, comprobante.moneda)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {comprobante.contacto_bancario.nombre_banco}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {comprobante.contacto_bancario.numero_cuenta}
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
                            onClick={() => handleVerVistaPrevia(comprobante.id)}
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
        </CardContent>
      </Card>

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
            title="Vista previa del comprobante"
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};