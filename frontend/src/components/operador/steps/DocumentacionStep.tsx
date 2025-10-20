// frontend/src/components/operador/steps/DocumentacionStep.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Checkbox,
    TextField,
    FormGroup,
    Divider,
    Tooltip,
    IconButton
} from '@mui/material';
import { 
    CloudDownload, 
    RemoveRedEye,
    CheckCircle,
    Cancel,
    Pending,
    Assignment,
    OpenInNew
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
    onEvaluarDocumento?: (documentoId: string, criterios: any, comentarios: string) => void; // Nueva prop
    onDescargarDocumento: (documento: Documento) => void;
    onVerDocumento: (documento: Documento) => void;
    loading?: boolean;
    solicitudId?: string;
}


// Criterios de evaluación por tipo de documento
const CRITERIOS_DOCUMENTOS = {
    dni: {
        titulo: 'CRITERIOS DE VALIDACIÓN - DNI',
        criterios: [
            { id: 'frente_legible', label: 'Frente legible y completo', desc: 'Documento frontal con información clara y completa' },
            { id: 'dorso_legible', label: 'Dorso legible y completo', desc: 'Documento reverso con información clara' },
            { id: 'datos_coinciden', label: 'Datos coinciden con solicitud', desc: 'Nombre, DNI y otros datos coinciden con la información registrada' },
            { id: 'vigente', label: 'Documento vigente', desc: 'DNI no está vencido' },
            { id: 'autenticidad', label: 'Autenticidad verificable', desc: 'No presenta signos de alteración o falsificación' }
        ]
    },
    cuit: {
        titulo: 'CRITERIOS DE VALIDACIÓN - CUIT',
        criterios: [
            { id: 'datos_empresa', label: 'Datos de empresa coincidentes', desc: 'Razón social, domicilio y actividad coinciden' },
            { id: 'cuit_valido', label: 'CUIT válido y activo', desc: 'Número de CUIT válido y empresa activa' },
            { id: 'fecha_emision', label: 'Fecha de emisión reciente', desc: 'Constancia con fecha reciente (últimos 3 meses)' },
            { id: 'formato_oficial', label: 'Formato oficial AFIP', desc: 'Documento emitido por AFIP con formato oficial' }
        ]
    },
    comprobante_domicilio: {
        titulo: 'CRITERIOS DE VALIDACIÓN - COMPROBANTE DOMICILIO',
        criterios: [
            { id: 'emisor_valido', label: 'Emisor válido reconocido', desc: 'EDENOR, Aysa, compañía telefónica, etc.' },
            { id: 'nombre_titular', label: 'Nombre del titular coincide', desc: 'Coincide con persona o representante legal' },
            { id: 'dni_cuit', label: 'DNI/CUIT coincidente', desc: 'Documento coincide con registrado en solicitud' },
            { id: 'domicilio_completo', label: 'Domicilio completo y legible', desc: 'Calle, número, piso/depto, CP y localidad correctos' },
            { id: 'periodo_reciente', label: 'Período y fecha reciente', desc: 'Documento de últimos 3 meses' }
        ]
    },
    balance_contable: {
        titulo: 'CRITERIOS CONTABLES Y FINANCIEROS - BALANCE CONTABLE',
        criterios: [
            { id: 'integridad_datos', label: 'Integridad de datos', desc: 'Balance incluye todos los rubros básicos (activo, pasivo, patrimonio)' },
            { id: 'consistencia_numerica', label: 'Consistencia numérica', desc: 'Totales correctamente sumados y cuadran (Activo = Pasivo + Patrimonio)' },
            { id: 'actualizacion_temporal', label: 'Actualización temporal', desc: 'Fecha del balance reciente (≤ 12 meses previos)' },
            { id: 'formato_estandarizado', label: 'Formato estandarizado', desc: 'Cumple con formatos contables nacionales (RT 9, RT 41)' },
            { id: 'liquidez_corriente', label: 'Liquidez corriente aceptable', desc: 'Ratio ≥ 1.0 (Activo corriente / Pasivo corriente)' },
            { id: 'endeudamiento_moderado', label: 'Endeudamiento moderado', desc: 'Ratio ≤ 1.0 (Pasivo / Patrimonio Neto)' },
            { id: 'solidez_patrimonial', label: 'Solidez patrimonial', desc: 'Patrimonio Neto / Activo ≥ 30%' }
        ]
    },
    declaracion_impuestos: {
        titulo: 'CRITERIOS FISCALES - DECLARACIÓN DE IMPUESTOS',
        criterios: [
            { id: 'emisor_oficial', label: 'Emisor oficial AFIP', desc: 'Formulario oficial de AFIP' },
            { id: 'cuit_coincidente', label: 'CUIT coincidente', desc: 'Coincide con empresa solicitante' },
            { id: 'razon_social', label: 'Razón social coincidente', desc: 'Coincide con registrado en solicitud' },
            { id: 'periodo_reciente', label: 'Período de declaración reciente', desc: 'Dentro del último año' },
            { id: 'cumplimiento_fiscal', label: 'Estado de cumplimiento', desc: 'Empresa activa y al día con impuestos' }
        ]
    },
    estado_financiero: {
        titulo: 'CRITERIOS FINANCIEROS - ESTADO FINANCIERO',
        criterios: [
            { id: 'estructura_completa', label: 'Estructura completa', desc: 'Incluye estado de resultados, flujos de efectivo' },
            { id: 'periodo_consistente', label: 'Período consistente', desc: 'Mismo período que el balance contable' },
            { id: 'rentabilidad', label: 'Rentabilidad acumulada', desc: 'Resultados acumulados positivos' },
            { id: 'margenes_consistentes', label: 'Márgenes consistentes', desc: 'Margen bruto y neto dentro de parámetros del sector' }
        ]
    }
};

export default function DocumentacionStep({
    documentos,
    scoring,
    onValidarDocumento,
    onEvaluarDocumento,
    onDescargarDocumento,
    onVerDocumento,
    loading = false,
    solicitudId
}: DocumentacionStepProps) {
    const [modalEvaluacion, setModalEvaluacion] = useState(false);
    const [documentoEvaluando, setDocumentoEvaluando] = useState<Documento | null>(null);
    const [checklist, setChecklist] = useState<{[key: string]: boolean}>({});
    const [comentarios, setComentarios] = useState('');
    const [evaluacionCargando, setEvaluacionCargando] = useState(false);

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

    // Abrir modal de evaluación
    const handleAbrirEvaluacion = (documento: Documento) => {
        setDocumentoEvaluando(documento);
        setChecklist({});
        setComentarios('');
        setModalEvaluacion(true);
    };

    // Cerrar modal
    const handleCerrarEvaluacion = () => {
        setModalEvaluacion(false);
        setDocumentoEvaluando(null);
        setChecklist({});
        setComentarios('');
    };

    // Manejar cambio en checklist
    const handleChecklistChange = (criterioId: string) => {
        setChecklist(prev => ({
            ...prev,
            [criterioId]: !prev[criterioId]
        }));
    };

    // Enviar evaluación
const handleEnviarEvaluacion = async () => {
    if (!documentoEvaluando) return;

    setEvaluacionCargando(true);
    try {
        const criterios = CRITERIOS_DOCUMENTOS[documentoEvaluando.tipo as keyof typeof CRITERIOS_DOCUMENTOS]?.criterios || [];
        const criteriosAprobados = criterios.filter(c => checklist[c.id]).length;
        const totalCriterios = criterios.length;

        const comentarioFinal = `Evaluación: ${criteriosAprobados}/${totalCriterios} criterios aprobados. ${comentarios ? `Comentarios: ${comentarios}` : ''}`;

        console.log('. Enviando evaluación al backend:', {
            documentoId: documentoEvaluando.id,
            criterios: checklist,
            comentarios: comentarioFinal
        });

        // USAR LA FUNCIÓN de evaluación
        if (onEvaluarDocumento) {
            await onEvaluarDocumento(documentoEvaluando.id, checklist, comentarioFinal);
            
            // Cerrar modal después de éxito
            setTimeout(() => {
                handleCerrarEvaluacion();
            }, 1500);
        } else {
            throw new Error('No hay función de evaluación disponible');
        }

    } catch (error) {
        console.error('. Error en evaluación:', error);
        // Mostrar error al usuario
    } finally {
        setEvaluacionCargando(false);
    }
};


    // Obtener criterios para el documento actual
    const obtenerCriteriosDocumento = () => {
        if (!documentoEvaluando) return { titulo: '', criterios: [] };
        return CRITERIOS_DOCUMENTOS[documentoEvaluando.tipo as keyof typeof CRITERIOS_DOCUMENTOS] || { titulo: 'Criterios de Evaluación', criterios: [] };
    };

    const criteriosActuales = obtenerCriteriosDocumento();

    // Función para abrir enlace de validación externa
    const handleValidacionExterna = (tipo: string) => {
        if (tipo === 'cuit') {
            // Abrir en nueva pestaña para validar CUIT
            window.open('https://seti.afip.gov.ar/padron-puc-baja-oficio-internet/ConsultaCuitReactivadaAction.do', '_blank');
        }
        // Para DNI, ya tenemos la información de verificaciones_kyc
    };

    const handleDescargarDocumento = async (documento: Documento) => {
        try {
            const session = await getSession();
            
            if (!session?.accessToken) {
                throw new Error('No estás autenticado');
            }

            console.log('📥 Descargando documento:', documento.nombre_archivo);

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
                const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                const supabaseUrl = `${baseUrl}/storage/v1/object/public/kyc-documents/${documento.ruta_storage}`;
                window.open(supabaseUrl, '_blank');
            }
        } catch (error) {
            console.error('. Error descargando documento:', error);
            const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseUrl = `${baseUrl}/storage/v1/object/public/kyc-documents/${documento.ruta_storage}`;
            window.open(supabaseUrl, '_blank');
        }
    };

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
                                            onClick={() => handleVerDocumento(documento)}
                                            fullWidth
                                        >
                                            VER
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<CloudDownload />}
                                            onClick={() => handleDescargarDocumento(documento)}
                                            fullWidth
                                        >
                                            DESCARGAR
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<Assignment />}
                                            onClick={() => handleAbrirEvaluacion(documento)}
                                            fullWidth
                                            disabled={loading}
                                        >
                                            EVALUAR
                                        </Button>
                                    </Stack>

                                    {/* Botones de validación externa */}
                                    {(documento.tipo === 'cuit') && (
                                        <Box sx={{ mt: 1 }}>
                                            <Button
                                                variant="text"
                                                size="small"
                                                startIcon={<OpenInNew />}
                                                onClick={() => handleValidacionExterna(documento.tipo)}
                                                fullWidth
                                            >
                                                Validar {documento.tipo.toUpperCase()} externamente
                                            </Button>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Modal de Evaluación */}
            <Dialog 
                open={modalEvaluacion} 
                onClose={handleCerrarEvaluacion}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Assignment />
                        Evaluar Documento - {documentoEvaluando ? getTipoDocumentoLabel(documentoEvaluando.tipo) : ''}
                    </Box>
                </DialogTitle>
                
                <DialogContent dividers>
                    {documentoEvaluando && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {criteriosActuales.titulo}
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Documento: <strong>{documentoEvaluando.nombre_archivo}</strong>
                            </Typography>

                            <FormGroup>
                                {criteriosActuales.criterios.map((criterio) => (
                                    <FormControlLabel
                                        key={criterio.id}
                                        control={
                                            <Checkbox
                                                checked={!!checklist[criterio.id]}
                                                onChange={() => handleChecklistChange(criterio.id)}
                                                color="primary"
                                            />
                                        }
                                        label={
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {criterio.label}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {criterio.desc}
                                                </Typography>
                                            </Box>
                                        }
                                        sx={{ mb: 1, alignItems: 'flex-start' }}
                                    />
                                ))}
                            </FormGroup>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle2" gutterBottom>
                                Comentarios Adicionales:
                            </Typography>
                            <TextField
                                multiline
                                rows={3}
                                fullWidth
                                value={comentarios}
                                onChange={(e) => setComentarios(e.target.value)}
                                placeholder="Agregar comentarios sobre la evaluación..."
                                variant="outlined"
                                size="small"
                            />

                            <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="caption">
                                    <strong>Progreso de evaluación:</strong> {Object.values(checklist).filter(Boolean).length} de {criteriosActuales.criterios.length} criterios aprobados
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                
                <DialogActions>
                    <Button onClick={handleCerrarEvaluacion} disabled={evaluacionCargando}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleEnviarEvaluacion}
                        variant="contained"
                        disabled={evaluacionCargando || Object.values(checklist).length === 0}
                    >
                        {evaluacionCargando ? 'Enviando...' : 'Enviar Evaluación'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}