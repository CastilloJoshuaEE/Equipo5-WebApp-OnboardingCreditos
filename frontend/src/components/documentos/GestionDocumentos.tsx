// frontend/src/components/documentos/GestionDocumentos.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getSession } from 'next-auth/react';
import { ChipProps } from '@mui/material';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  useMediaQuery,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import { 
  Download, 
  Visibility, 
  CloudUpload, 
  Edit,
  ExpandMore,
  Description,
  CheckCircle,
  Warning,
  Cancel,
  FilePresent,
  Delete,
  Refresh
} from '@mui/icons-material';
import { DocumentoData } from '@/features/documentos/documento.types';
import { GestionDocumentosProps } from '@/features/documentos/documento.types';

export default function GestionDocumentos({ solicitudId }: GestionDocumentosProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [documentos, setDocumentos] = useState<DocumentoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [documentoAEliminar, setDocumentoAEliminar] = useState<DocumentoData | null>(null);
  const [subiendoArchivo, setSubiendoArchivo] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | false>('subir');

  const cargarDocumentos = useCallback(async () => {
    try {
      setLoading(true);
      const session = await getSession();

      if (!session?.accessToken) {
        throw new Error('No estás autenticado');
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${API_URL}/solicitudes/${solicitudId}/documentos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron cargar los documentos`);
      }

      const result = await response.json();
      setDocumentos(result.data || []);
    } catch (error: unknown) {
      console.error('Error cargando documentos:', error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error al cargar los documentos');
      }
    } finally {
      setLoading(false);
    }
  }, [solicitudId]);

  useEffect(() => {
    cargarDocumentos();
  }, [cargarDocumentos]);

  const handleSubirDocumento = async (tipo: string, archivo: File) => {
    try {
      setSubiendoArchivo(tipo);
      setError('');
      
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No estás autenticado');
      }

      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('solicitud_id', solicitudId);
      formData.append('tipo', tipo);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/solicitudes/${solicitudId}/documentos`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir documento');
      }

      setSuccess('Documento subido exitosamente');
      await cargarDocumentos();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocurrió un error');
      }
    } finally {
      setSubiendoArchivo(null);
    }
  };

  const handleActualizarDocumento = async (documentoId: string, tipo: string, archivo: File) => {
    try {
      setSubiendoArchivo(tipo);
      setError('');
      
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No estás autenticado');
      }

      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('tipo', tipo);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/documentos/${documentoId}`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar documento');
      }

      setSuccess('Documento actualizado exitosamente');
      await cargarDocumentos();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocurrió un error');
      }
    } finally {
      setSubiendoArchivo(null);
    }
  };

  const handleEliminarDocumento = async (documento: DocumentoData) => {
    try {
      setError('');
      
      const session = await getSession();
      if (!session?.accessToken) {
        throw new Error('No estás autenticado');
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/documentos/${documento.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar documento');
      }

      setSuccess('Documento eliminado exitosamente');
      setDialogOpen(false);
      setDocumentoAEliminar(null);
      await cargarDocumentos();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocurrió un error');
      }
    }
  };

  const descargarDocumento = async (documento: DocumentoData) => {
    try {
      const session = await getSession();
      
      if (!session?.accessToken) {
        throw new Error('No estás autenticado');
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/documentos/${documento.id}/descargar`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseUrl = `${baseUrl}/storage/v1/object/public/kyc-documents/${documento.ruta_storage}`;
        window.open(supabaseUrl, '_blank');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = documento.nombre_archivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando documento:', error);
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseUrl = `${baseUrl}/storage/v1/object/public/kyc-documents/${documento.ruta_storage}`;
      window.open(supabaseUrl, '_blank');
    }
  };

  const verDocumento = (documento: DocumentoData) => {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseUrl = `${baseUrl}/storage/v1/object/public/kyc-documents/${documento.ruta_storage}`;
    window.open(supabaseUrl, '_blank');
  };

  const getEstadoColor = (estado: string) => {
    const colores: Record<string, ChipProps['color']> = {
      'pendiente': 'warning',
      'validado': 'success',
      'rechazado': 'error'
    };
    return colores[estado] || 'default';
  };

  const getEstadoIcon = (estado: string) => {
    switch(estado) {
      case 'validado':
        return <CheckCircle fontSize="small" color="success" />;
      case 'rechazado':
        return <Cancel fontSize="small" color="error" />;
      default:
        return <Warning fontSize="small" color="warning" />;
    }
  };

  const getTipoDocumentoLabel = (tipo: string) => {
    const labels: { [key: string]: string } = {
      'dni': 'DNI',
      'cuit': 'CUIT',
      'comprobante_domicilio': 'Comprobante Domicilio',
      'balance_contable': 'Balance Contable',
      'estado_financiero': 'Estado Financiero',
      'declaracion_impuestos': 'Declaración Impuestos'
    };
    return labels[tipo] || tipo;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isMobile) {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const DocumentoInput = ({ tipo, documentoExistente }: { tipo: string, documentoExistente?: DocumentoData }) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (documentoExistente) {
          handleActualizarDocumento(documentoExistente.id, tipo, file);
        } else {
          handleSubirDocumento(tipo, file);
        }
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    };

    return (
      <Box>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id={`file-input-${tipo}-${solicitudId}`}
        />
        <label htmlFor={`file-input-${tipo}-${solicitudId}`} style={{ width: '100%' }}>
          <Button
            variant={documentoExistente ? "outlined" : "contained"}
            component="span"
            disabled={subiendoArchivo === tipo}
            startIcon={subiendoArchivo === tipo ? <CircularProgress size={20} /> : <CloudUpload />}
            fullWidth
            size={isMobile ? "small" : "medium"}
            sx={{
              py: isMobile ? 1 : 1.5,
              fontSize: isMobile ? '0.75rem' : '0.875rem'
            }}
          >
            {subiendoArchivo === tipo ? 'Subiendo...' : documentoExistente ? 'Actualizar' : 'Subir'}
          </Button>
        </label>
        {documentoExistente && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}>
            {getTipoDocumentoLabel(tipo)} actual
          </Typography>
        )}
      </Box>
    );
  };

  const DocumentoCardMobile = ({ documento }: { documento: DocumentoData }) => (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        mb: 2,
        borderLeft: 6,
        borderColor: documento.estado === 'validado' ? 'success.main' : 
                     documento.estado === 'rechazado' ? 'error.main' : 'warning.main'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Description color="primary" />
          <Typography variant="subtitle2" fontWeight="bold">
            {getTipoDocumentoLabel(documento.tipo)}
          </Typography>
        </Box>
        <Chip 
          label={documento.estado}
          color={getEstadoColor(documento.estado)}
          size="small"
          icon={getEstadoIcon(documento.estado)}
        />
      </Box>

      <Typography variant="body2" noWrap sx={{ mb: 1 }}>
        {documento.nombre_archivo}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Tamaño: {formatFileSize(documento.tamanio_bytes)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Subido: {formatDate(documento.created_at)}
        </Typography>
      </Box>

      {documento.comentarios && (
        <Alert severity="info" sx={{ my: 1, py: 0 }}>
          <Typography variant="caption">{documento.comentarios}</Typography>
        </Alert>
      )}

      <Divider sx={{ my: 1.5 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-around', gap: 1 }}>
        <Tooltip title="Ver documento">
          <IconButton size="small" color="primary" onClick={() => verDocumento(documento)}>
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Descargar">
          <IconButton size="small" color="secondary" onClick={() => descargarDocumento(documento)}>
            <Download fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Actualizar">
          <IconButton
            size="small"
            color="info"
            onClick={() => {
              const input = document.getElementById(`file-input-${documento.tipo}-${solicitudId}`) as HTMLInputElement;
              if (input) input.click();
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton
            size="small"
            color="error"
            onClick={() => {
              setDocumentoAEliminar(documento);
              setDialogOpen(true);
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress size={isMobile ? 30 : 40} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Cargando documentos...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Alertas */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>

      {error && (
        <Alert 
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Sección de Subida de Documentos */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Accordion 
            expanded={expandedSection === 'subir'} 
            onChange={() => setExpandedSection(expandedSection === 'subir' ? false : 'subir')}
            sx={{ boxShadow: 'none' }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudUpload color="primary" />
                <Typography variant={isMobile ? "subtitle1" : "h6"}>
                  Subir Documentos
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Sube los documentos requeridos para tu solicitud de crédito
              </Typography>

              <Grid container spacing={isMobile ? 1 : 2}>
                {['dni', 'cuit', 'comprobante_domicilio', 'balance_contable', 'declaracion_impuestos'].map((tipo) => {
                  const documentoExistente = documentos.find(doc => doc.tipo === tipo);
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tipo}>
                      <DocumentoInput 
                        tipo={tipo} 
                        documentoExistente={documentoExistente}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Lista de Documentos Subidos */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 1 : 0,
          mb: 2 
        }}
      >
        <Typography variant={isMobile ? "subtitle1" : "h6"}>
          Documentos Subidos ({documentos.length})
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={cargarDocumentos}
          size={isMobile ? "small" : "medium"}
          fullWidth={isMobile}
        >
          Actualizar Lista
        </Button>
      </Box>

      {documentos.length === 0 ? (
        <Alert severity="info">
          No hay documentos subidos para esta solicitud.
        </Alert>
      ) : (
        <>
          {isMobile ? (
            // Vista móvil: Cards
            <Box>
              {documentos.map((documento) => (
                <DocumentoCardMobile key={documento.id} documento={documento} />
              ))}
            </Box>
          ) : (
            // Vista desktop: Tabla
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, overflowX: 'auto' }}>
              <Table size={isTablet ? "small" : "medium"}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Archivo</strong></TableCell>
                    <TableCell><strong>Tamaño</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Comentarios</strong></TableCell>
                    <TableCell align="center"><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {documentos.map((documento) => (
                    <TableRow 
                      key={documento.id}
                      hover
                      sx={{ 
                        '&:nth-of-type(odd)': { backgroundColor: '#fafafa' }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {getTipoDocumentoLabel(documento.tipo)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Tooltip title={documento.nombre_archivo}>
                          <Typography 
                            variant="body2" 
                            noWrap 
                            sx={{ maxWidth: 200, textOverflow: 'ellipsis', overflow: 'hidden' }}
                          >
                            {documento.nombre_archivo}
                          </Typography>
                        </Tooltip>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {formatFileSize(documento.tamanio_bytes)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip 
                          label={documento.estado}
                          color={getEstadoColor(documento.estado)}
                          size="small"
                          icon={getEstadoIcon(documento.estado)}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(documento.created_at)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Tooltip title={documento.comentarios || 'Sin comentarios'}>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 150,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {documento.comentarios || '—'}
                          </Typography>
                        </Tooltip>
                      </TableCell>

                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={0.5}>
                          <Tooltip title="Ver">
                            <IconButton size="small" color="primary" onClick={() => verDocumento(documento)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Descargar">
                            <IconButton size="small" color="secondary" onClick={() => descargarDocumento(documento)}>
                              <Download fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Actualizar">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => {
                                const input = document.getElementById(`file-input-${documento.tipo}-${solicitudId}`) as HTMLInputElement;
                                if (input) input.click();
                              }}
                            >
                              <Edit fontSize="small" />
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
        </>
      )}

      {/* Dialog de Confirmación para Eliminar */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el documento{' '}
            <strong>&quot;{documentoAEliminar?.nombre_archivo}&quot;</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, flexDirection: isMobile ? 'column' : 'row', gap: 1 }}>
          <Button 
            onClick={() => setDialogOpen(false)}
            fullWidth={isMobile}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => documentoAEliminar && handleEliminarDocumento(documentoAEliminar)}
            color="error"
            variant="contained"
            fullWidth={isMobile}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {documentos.length > 0 && (
        <Box mt={2}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
            * Puedes actualizar cualquier documento subiendo un nuevo archivo del mismo tipo
          </Typography>
        </Box>
      )}
    </Box>
  );
}