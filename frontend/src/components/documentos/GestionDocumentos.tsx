// En frontend/src/components/documentos/GestionDocumentos.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { getSession } from 'next-auth/react';
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
  Snackbar
} from '@mui/material';
import { Download, Visibility, CloudUpload, Delete, Edit } from '@mui/icons-material';

interface Documento {
  id: string;
  tipo: string;
  nombre_archivo: string;
  ruta_storage: string;
  tamanio_bytes: number;
  estado: string;
  created_at: string;
  validado_en?: string;
  comentarios?: string;
  informacion_extraida?: any;
  updated_at?: string;
}

interface GestionDocumentosProps {
  solicitudId: string;
}

export default function GestionDocumentos({ solicitudId }: GestionDocumentosProps) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [documentoAEliminar, setDocumentoAEliminar] = useState<Documento | null>(null);
  const [subiendoArchivo, setSubiendoArchivo] = useState<string | null>(null);

  useEffect(() => {
    cargarDocumentos();
  }, [solicitudId]);

  const cargarDocumentos = async () => {
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
          'Authorization': `Bearer ${session.accessToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron cargar los documentos`);
      }

      const result = await response.json();
      setDocumentos(result.data || []);
    } catch (error: any) {
      console.error('Error cargando documentos:', error);
      setError(error.message || 'Error al cargar los documentos');
    } finally {
      setLoading(false);
    }
  };

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
    } catch (error: any) {
      console.error('Error subiendo documento:', error);
      setError(error.message || 'Error al subir documento');
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
    } catch (error: any) {
      console.error('Error actualizando documento:', error);
      setError(error.message || 'Error al actualizar documento');
    } finally {
      setSubiendoArchivo(null);
    }
  };

  const handleEliminarDocumento = async (documento: Documento) => {
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
    } catch (error: any) {
      console.error('Error eliminando documento:', error);
      setError(error.message || 'Error al eliminar documento');
    }
  };

  const descargarDocumento = async (documento: Documento) => {
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

  const verDocumento = (documento: Documento) => {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseUrl = `${baseUrl}/storage/v1/object/public/kyc-documents/${documento.ruta_storage}`;
    window.open(supabaseUrl, '_blank');
  };

  const getEstadoColor = (estado: string) => {
    const colores: { [key: string]: any } = {
      'pendiente': 'warning',
      'validado': 'success',
      'rechazado': 'error'
    };
    return colores[estado] || 'default';
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

  const DocumentoInput = ({ tipo, documentoExistente }: { tipo: string, documentoExistente?: Documento }) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (documentoExistente) {
          handleActualizarDocumento(documentoExistente.id, tipo, file);
        } else {
          handleSubirDocumento(tipo, file);
        }
        // Reset input
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    };

    return (
      <Box sx={{ mb: 2 }}>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id={`file-input-${tipo}`}
        />
        <label htmlFor={`file-input-${tipo}`}>
          <Button
            variant={documentoExistente ? "outlined" : "contained"}
            component="span"
            disabled={subiendoArchivo === tipo}
            startIcon={<CloudUpload />}
            fullWidth
          >
            {subiendoArchivo === tipo ? (
              <CircularProgress size={20} />
            ) : documentoExistente ? (
              `Actualizar ${getTipoDocumentoLabel(tipo)}`
            ) : (
              `Subir ${getTipoDocumentoLabel(tipo)}`
            )}
          </Button>
        </label>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
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
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Subir Documentos
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Sube los documentos requeridos para tu solicitud de crédito
          </Typography>

          <Grid container spacing={2}>
            {['dni', 'cuit', 'comprobante_domicilio', 'balance_contable', 'declaracion_impuestos'].map((tipo) => {
              const documentoExistente = documentos.find(doc => doc.tipo === tipo);
              return (
                <Grid size={{ xs: 12, md: 6 }} key={tipo}>
                  <DocumentoInput 
                    tipo={tipo} 
                    documentoExistente={documentoExistente}
                  />
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de Documentos Subidos */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Documentos Subidos ({documentos.length})
        </Typography>
        <Button
          variant="outlined"
          startIcon={<CloudUpload />}
          onClick={cargarDocumentos}
        >
          Actualizar Lista
        </Button>
      </Box>

      {documentos.length === 0 ? (
        <Alert severity="info">
          No hay documentos subidos para esta solicitud.
        </Alert>
      ) : (
       <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
  <Table>
    <TableHead>
      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
        <TableCell><strong>Tipo</strong></TableCell>
        <TableCell><strong>Nombre del Archivo</strong></TableCell>
        <TableCell><strong>Tamaño</strong></TableCell>
        <TableCell><strong>Estado</strong></TableCell>
        <TableCell><strong>Fecha de Subida</strong></TableCell>
        <TableCell><strong>Fecha de Actualización</strong></TableCell>
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
            '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
            transition: 'background-color 0.2s ease-in-out'
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
                sx={{ maxWidth: 220, textOverflow: 'ellipsis', overflow: 'hidden' }}
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
              sx={{ fontWeight: 'bold' }}
            />
          </TableCell>

          <TableCell>
            <Typography variant="body2">
              {new Date(documento.created_at).toLocaleDateString('es-ES')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(documento.created_at).toLocaleTimeString('es-ES')}
            </Typography>
          </TableCell>

          <TableCell>
            <Typography variant="body2">
              {documento.updated_at 
                ? new Date(documento.updated_at).toLocaleDateString('es-ES')
                : '—'}
            </Typography>
            {documento.updated_at && (
              <Typography variant="caption" color="text.secondary">
                {new Date(documento.updated_at).toLocaleTimeString('es-ES')}
              </Typography>
            )}
          </TableCell>

          <TableCell>
            <Tooltip title={documento.comentarios || 'Sin comentarios'}>
              <Typography
                variant="body2"
                sx={{
                  maxWidth: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  cursor: documento.comentarios ? 'pointer' : 'default',
                }}
              >
                {documento.comentarios || '—'}
              </Typography>
            </Tooltip>
          </TableCell>

          <TableCell align="center">
            <Box display="flex" justifyContent="center" gap={1}>
              <Tooltip title="Ver documento">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => verDocumento(documento)}
                >
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Descargar documento">
                <IconButton
                  size="small"
                  color="secondary"
                  onClick={() => descargarDocumento(documento)}
                >
                  <Download fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Actualizar documento">
                <IconButton
                  size="small"
                  color="info"
                  onClick={() => {
                    const input = document.getElementById(`file-input-${documento.tipo}`) as HTMLInputElement;
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

      {/* Dialog de Confirmación para Eliminar */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el documento "{documentoAEliminar?.nombre_archivo}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => documentoAEliminar && handleEliminarDocumento(documentoAEliminar)}
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {documentos.length > 0 && (
        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            * Puedes actualizar cualquier documento subiendo un nuevo archivo del mismo tipo
          </Typography>
        </Box>
      )}
    </Box>
  );
}