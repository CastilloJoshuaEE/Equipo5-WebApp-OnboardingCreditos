// frontend/src/components/operador/steps/DocumentacionStep.tsx
'use client';

import React, { useState } from 'react';
import { getSession } from 'next-auth/react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Button,
    LinearProgress,
    Stack,
    Alert
} from '@mui/material';
import { 
    CloudDownload, 
    RemoveRedEye,
    CheckCircle,
    Cancel,
    Pending
} from '@mui/icons-material';

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

interface DocumentacionStepProps {
    documentos: Documento[];
    scoring: any;
    onValidarDocumento: (documentoId: string, estado: string, comentarios?: string) => void;
    onDescargarDocumento: (documento: Documento) => void;
    onVerDocumento: (documento: Documento) => void;
    loading?: boolean;
}

export default function DocumentacionStep({
    documentos,
    scoring,
    onValidarDocumento,
    onDescargarDocumento,
    onVerDocumento,
    loading = false
}: DocumentacionStepProps) {
    const getEstadoColor = (estado: string) => {
        const colores: { [key: string]: any } = {
            'validado': 'success',
            'pendiente': 'warning',
            'rechazado': 'error',
            'faltante': 'default'
        };
        return colores[estado] || 'default';
    };

    const getEstadoIcon = (estado: string) => {
        const icons: { [key: string]: any } = {
            'validado': <CheckCircle />,
            'pendiente': <Pending />,
            'rechazado': <Cancel />,
            'faltante': <Cancel />
        };
        return icons[estado] || <Pending />;
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
        return labels[tipo] || tipo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatFileSize = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Obtener todos los tipos de documentos únicos que existen en la solicitud
    const tiposDocumentosExistentes = [...new Set(documentos.map(doc => doc.tipo))];
    const handleDescargarDocumento = async (documento: Documento) => {
        try {
            const session = await getSession();
            
            if (!session?.accessToken) {
                throw new Error('No estás autenticado');
            }

            console.log('📥 Descargando documento:', documento.nombre_archivo);

            // Primero intentar con el endpoint de descarga
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${API_URL}/documentos/${documento.id}/descargar`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = documento.nombre_archivo;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                console.log('. Documento descargado exitosamente');
            } else {
                // Fallback: usar URL directa de Supabase
                console.log('. Usando fallback de Supabase Storage');
                const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                const supabaseUrl = `${baseUrl}/storage/v1/object/public/kyc-documents/${documento.ruta_storage}`;
                window.open(supabaseUrl, '_blank');
            }
        } catch (error) {
            console.error('❌ Error descargando documento:', error);
            // Fallback final
            const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseUrl = `${baseUrl}/storage/v1/object/public/kyc-documents/${documento.ruta_storage}`;
            window.open(supabaseUrl, '_blank');
        }
    };

    // FUNCIÓN CORREGIDA: Ver documento específico
    const handleVerDocumento = (documento: Documento) => {
        console.log('👀 Abriendo documento:', documento.nombre_archivo);
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseUrl = `${baseUrl}/storage/v1/object/public/kyc-documents/${documento.ruta_storage}`;
        window.open(supabaseUrl, '_blank');
    };

    return (
        <Box>
            {/* Scoring General */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                            Progreso de Documentación
                        </Typography>
                        <Chip 
                            label={`${scoring?.total || 0}% Completado`}
                            color={scoring?.total >= 80 ? 'success' : scoring?.total >= 60 ? 'warning' : 'error'}
                            variant="outlined"
                        />
                    </Box>
                    
                    <LinearProgress 
                        variant="determinate" 
                        value={scoring?.total || 0} 
                        sx={{ 
                            height: 10, 
                            borderRadius: 5,
                            mb: 2 
                        }}
                    />
                    
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box textAlign="center">
                                <Typography variant="h4" color="success.main">
                                    {scoring?.documentosValidados || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Documentos Validados
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box textAlign="center">
                                <Typography variant="h4" color="warning.main">
                                    {scoring?.documentosPendientes || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Pendientes
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box textAlign="center">
                                <Typography variant="h4" color="error.main">
                                    {scoring?.documentosFaltantes?.length || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Faltantes
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Documentos en formato de tarjetas */}
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Documentación ({documentos.length} documentos)
            </Typography>

            {documentos.length === 0 ? (
                <Alert severity="info">
                    No hay documentos subidos para esta solicitud.
                </Alert>
            ) : (
                <Grid container spacing={3}>
                    {documentos.map((documento) => (
                        <Grid size={{ xs: 12, md: 6 }} key={documento.id}>
                            <Card 
                                variant="outlined" 
                                sx={{ 
                                    height: '100%',
                                    borderColor: 'divider',
                                    opacity: documento.estado === 'faltante' ? 0.7 : 1
                                }}
                            >
                                <CardContent>
                                    {/* Header con tipo de documento y estado */}
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {getEstadoIcon(documento.estado)}
                                            <Typography variant="h6" component="div">
                                                {getTipoDocumentoLabel(documento.tipo)}
                                            </Typography>
                                        </Box>
                                        <Chip 
                                            label={documento.estado.toUpperCase()}
                                            color={getEstadoColor(documento.estado)}
                                            size="small"
                                            variant="filled"
                                        />
                                    </Box>

                                    {/* Información del documento */}
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        <strong>Archivo:</strong> {documento.nombre_archivo}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        <strong>Tamaño:</strong> {formatFileSize(documento.tamanio_bytes)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        <strong>Subido:</strong> {new Date(documento.created_at).toLocaleDateString()}
                                    </Typography>
                                    
                                    {documento.comentarios && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            <strong>Comentarios:</strong> {documento.comentarios}
                                        </Typography>
                                    )}

                                    {/* Botones de acción */}
                                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<RemoveRedEye />}
                                            onClick={() => onVerDocumento(documento)}
                                            fullWidth
                                        >
                                            VER DOCUMENTO
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<CloudDownload />}
onClick={() => handleDescargarDocumento(documento)}
                                            fullWidth
                                        >
                                            DESCARGAR
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

        </Box>
    );
}