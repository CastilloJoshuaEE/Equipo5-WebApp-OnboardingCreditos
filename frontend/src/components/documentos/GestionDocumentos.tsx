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
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { Download, Visibility, CloudUpload } from '@mui/icons-material';

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
}

interface GestionDocumentosProps {
  solicitudId: string;
}

export default function GestionDocumentos({ solicitudId }: GestionDocumentosProps) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const descargarDocumento = async (documento: Documento) => {
    try {
      const session = await getSession();
      
      if (!session?.accessToken) {
        throw new Error('No estás autenticado');
      }

      // Obtener la URL de descarga desde Supabase Storage
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/documentos/${documento.id}/descargar`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        // Si no hay endpoint específico, usar la URL pública de Supabase
        const supabaseUrl = `https://ezqszozrtecuksfjaakq.supabase.co/storage/v1/object/public/kyc-documents/${documento.ruta_storage}`;
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
      // Fallback: abrir en nueva pestaña
      const supabaseUrl = `https://ezqszozrtecuksfjaakq.supabase.co/storage/v1/object/public/kyc-documents/${documento.ruta_storage}`;
      window.open(supabaseUrl, '_blank');
    }
  };

  const verDocumento = (documento: Documento) => {
    const supabaseUrl = `https://ezqszozrtecuksfjaakq.supabase.co/storage/v1/object/public/kyc-documents/${documento.ruta_storage}`;
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

  if (error) {
    return (
      <Alert 
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={cargarDocumentos}>
            Reintentar
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Tipo de Documento</strong></TableCell>
                <TableCell><strong>Nombre del Archivo</strong></TableCell>
                <TableCell><strong>Tamaño</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Fecha de Subida</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documentos.map((documento) => (
                <TableRow key={documento.id}>
                  <TableCell>
                    <Typography variant="body2">
                      {getTipoDocumentoLabel(documento.tipo)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap title={documento.nombre_archivo}>
                      {documento.nombre_archivo}
                    </Typography>
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
                    <Box display="flex" gap={1}>
                      <Tooltip title="Ver documento">
                        <IconButton
                          size="small"
                          onClick={() => verDocumento(documento)}
                          color="primary"
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Descargar documento">
                        <IconButton
                          size="small"
                          onClick={() => descargarDocumento(documento)}
                          color="secondary"
                        >
                          <Download />
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

      {documentos.length > 0 && (
        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            * Los documentos se almacenan de forma segura en Supabase Storage
          </Typography>
        </Box>
      )}
    </Box>
  );
}