// frontend/src/components/documentos/DocumentosContrato.tsx
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
  Dialog,
  DialogContent,
  Tooltip,
} from '@mui/material';
import {
  Download,
  Visibility,
  Description,
  CheckCircle,
  Schedule,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useDocumentos } from '@/features/documentos/hooks/useDocumentos';
import { DocumentoContrato } from '@/services/documentos/documento.types';
import { DocumentosContratoProps } from '@/features/contratos/contrato.types';

export const DocumentosContrato: React.FC<DocumentosContratoProps> = ({ solicitudId }) => {
  const {
    loading,
    error,
    obtenerDocumentosContrato,
    descargarContrato,
    obtenerVistaPrevia,
  } = useDocumentos();

  const [documentos, setDocumentos] = useState<{ contrato: DocumentoContrato; firma: any } | null>(null);
  const [vistaPreviaAbierta, setVistaPreviaAbierta] = useState(false);
  const [urlVistaPrevia, setUrlVistaPrevia] = useState('');

  useEffect(() => {
    cargarDocumentos();
  }, [solicitudId]);

  const cargarDocumentos = async () => {
    try {
      const data = await obtenerDocumentosContrato(solicitudId);
      setDocumentos(data);
    } catch (err) {
      console.error('Error cargando documentos:', err);
    }
  };

  const handleDescargarContrato = async () => {
    if (!documentos?.contrato.id) return;
    
    try {
      await descargarContrato(
        documentos.contrato.id,
        `contrato-${documentos.contrato.numero_contrato}.docx`
      );
    } catch (err) {
      console.error('Error descargando contrato:', err);
    }
  };

  const handleVerVistaPrevia = async () => {
    if (!documentos?.contrato.id) return;
    
    try {
      const vistaPrevia = await obtenerVistaPrevia('contrato', documentos.contrato.id);
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
        return 'success';
      case 'pendiente_firma':
      case 'generado':
        return 'warning';
      case 'expirado':
      case 'rechazado':
        return 'error';
      default:
        return 'default';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'firmado_completo':
      case 'vigente':
        return <CheckCircle />;
      case 'pendiente_firma':
      case 'generado':
        return <Schedule />;
      case 'expirado':
      case 'rechazado':
        return <ErrorIcon />;
      default:
        return <Description />;
    }
  };

  if (loading && !documentos) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !documentos) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!documentos) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No se encontraron documentos de contrato para esta solicitud.
      </Alert>
    );
  }

  return (
    <Box>
      <Card variant="outlined">
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="h2">
              . Documentos del Contrato
            </Typography>
            <Chip
              icon={getEstadoIcon(documentos.contrato.estado)}
              label={documentos.contrato.estado.replace('_', ' ').toUpperCase()}
              color={getEstadoColor(documentos.contrato.estado)}
              variant="outlined"
            />
          </Box>

          <Grid container spacing={3}>
            {/* Información del Contrato */}
<Grid size={{ xs: 12, md: 6}}>
                  <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Número de Contrato
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {documentos.contrato.numero_contrato}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Fecha de Creación
                </Typography>
                <Typography variant="body1">
                  {new Date(documentos.contrato.fecha_creacion).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Box>

              {documentos.firma && (
                <Box mb={2}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Estado de Firma Digital
                  </Typography>
                  <Chip
                    icon={getEstadoIcon(documentos.firma.estado)}
                    label={documentos.firma.estado.replace('_', ' ').toUpperCase()}
                    color={getEstadoColor(documentos.firma.estado)}
                    size="small"
                  />
                </Box>
              )}
            </Grid>

            {/* Acciones */}
<Grid size={{ xs: 12, md: 6}}>
                  <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleDescargarContrato}
                  disabled={!documentos.contrato.ruta_documento}
                  fullWidth
                >
                  Descargar Contrato
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Visibility />}
                  onClick={handleVerVistaPrevia}
                  disabled={!documentos.contrato.ruta_documento}
                  fullWidth
                >
                  Vista Previa
                </Button>

                {documentos.firma?.url_documento_firmado && (
                  <Tooltip title="Documento con firma digital aplicada">
                    <Button
                      variant="outlined"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => window.open(documentos.firma.url_documento_firmado, '_blank')}
                      fullWidth
                    >
                      Ver Firmado
                    </Button>
                  </Tooltip>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Información adicional de firma digital */}
          {documentos.firma && documentos.firma.fecha_firma_completa && (
            <Box mt={2} p={2} bgcolor="success.light" borderRadius={1}>
              <Typography variant="body2" color="success.dark">
                . Contrato completamente firmado el{' '}
                {new Date(documentos.firma.fecha_firma_completa).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            </Box>
          )}
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
            title="Vista previa del contrato"
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};