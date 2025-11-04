// frontend/src/components/operador/steps/DecisionStep.tsx
'use client';
import React, { useState } from 'react';
import { getSession } from 'next-auth/react';
import { SolicitudOperador } from '@/types/operador';
import { useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Chip,
    Divider,
    LinearProgress,
    Grid,
    Stack
} from '@mui/material';
import { 
    CheckCircle, 
    Cancel, 
    Comment, 
    Send,
    Warning,
    ThumbUp,
    ThumbDown,
    Block
} from '@mui/icons-material';

interface DecisionStepProps {
    solicitud: any;
    onClose: () => void;
    onComentarioEnviado?: (comentario: string) => void;
    onDecisionTomada?: (decision: string, motivo?: string) => void;
    onDashboardActualizado?: () => void;
    loading?: boolean;
}

// Criterios para la decisión final
const CRITERIOS_DECISION = {
    aprobacion: {
        titulo: 'CRITERIOS PARA APROBACIÓN',
        criterios: [
            { id: 'documentacion_completa', label: 'Documentación completa y válida', desc: 'Todos los documentos requeridos están presentes y validados' },
            { id: 'scoring_adecuado', label: 'Scoring dentro de parámetros', desc: 'Puntaje de riesgo dentro de los límites aceptables' },
            { id: 'capacidad_pago', label: 'Capacidad de pago demostrada', desc: 'Análisis financiero indica capacidad para cumplir con obligaciones' },
            { id: 'historial_limpio', label: 'Historial crediticio favorable', desc: 'Sin antecedentes negativos en verificaciones' },
            { id: 'coherencia_datos', label: 'Coherencia en información', desc: 'Datos consistentes en toda la documentación' }
        ]
    },
    rechazo: {
        titulo: 'MOTIVOS COMUNES DE RECHAZO',
        criterios: [
            { id: 'documentacion_incompleta', label: 'Documentación incompleta', desc: 'Faltan documentos esenciales o están vencidos' },
            { id: 'scoring_bajo', label: 'Scoring muy bajo', desc: 'Puntaje de riesgo fuera de parámetros aceptables' },
            { id: 'capacidad_pago_insuficiente', label: 'Capacidad de pago insuficiente', desc: 'Análisis financiero no respalda la solicitud' },
            { id: 'historial_negativo', label: 'Historial crediticio negativo', desc: 'Antecedentes de incumplimiento o morosidad' },
            { id: 'inconsistencias', label: 'Inconsistencias graves', desc: 'Contradicciones en la información proporcionada' }
        ]
    }
};

export default function DecisionStep({ 
    solicitud, 
    onClose, 
    onComentarioEnviado, 
    onDecisionTomada,
    onDashboardActualizado,
}: DecisionStepProps) {
    const [solicitudes, setSolicitudes] = useState<SolicitudOperador[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtros, setFiltros] = useState({
        estado: '',
        nivel_riesgo: '',
        fecha_desde: '',
        fecha_hasta: '',
        numero_solicitud: '',
        dni: ''
    });
    const [dialogoComentario, setDialogoComentario] = useState(false);
    const [dialogoDecision, setDialogoDecision] = useState(false);
    const [tipoDecision, setTipoDecision] = useState<'aprobacion' | 'rechazo' | null>(null);
    const [comentario, setComentario] = useState('');
    const [motivoDecision, setMotivoDecision] = useState('');
    const [checklistDecision, setChecklistDecision] = useState<{[key: string]: boolean}>({});
    const [enviando, setEnviando] = useState(false);
    const [mensaje, setMensaje] = useState('');

    // Estados para controlar si la solicitud ya fue revisada
    const [solicitudYaRevisada, setSolicitudYaRevisada] = useState(false);
    const [estadoActual, setEstadoActual] = useState('');

    useEffect(() => {
        cargarDashboard();
        verificarEstadoSolicitud();
    }, [solicitud]);

    // Verificar si la solicitud ya fue revisada (aprobada o rechazada)
    const verificarEstadoSolicitud = () => {
        if (solicitud?.estado) {
            console.log('🔍 Verificando estado de solicitud:', solicitud.estado);
            setEstadoActual(solicitud.estado);
            
            // Si el estado es 'aprobado' o 'rechazado', deshabilitar botones
            const estadosFinales = ['aprobado', 'rechazado'];
            const yaRevisada = estadosFinales.includes(solicitud.estado);
            
            console.log('📊 Estado actual:', solicitud.estado, '¿Ya revisada?:', yaRevisada);
            
            setSolicitudYaRevisada(yaRevisada);
        } else {
            console.log('⚠️ No se pudo obtener el estado de la solicitud');
        }
    };

    // Calcular progreso de documentación
    const calcularProgresoDocumentacion = () => {
        if (!solicitud.documentos || solicitud.documentos.length === 0) return 0;
        
        const documentosValidados = solicitud.documentos.filter((doc: any) => 
            doc.estado === 'validado'
        ).length;
        
        return (documentosValidados / solicitud.documentos.length) * 100;
    };

    const progresoDocumentacion = calcularProgresoDocumentacion();

    const cargarDashboard = async () => {
        try {
            const session = await getSession();
            if (!session?.accessToken) {
                console.error('. No hay token de acceso');
                return;
            }

            const params = new URLSearchParams();
            Object.entries(filtros).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${API_URL}/operador/dashboard?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSolicitudes(data.data.solicitudes || []);
            } else {
                const errorText = await response.text();
                console.error('. Error cargando dashboard:', response.status, errorText);
            }
        } catch (error) {
            console.error('. Error cargando dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    // Manejar aprobación con token seguro
    const handleAprobar = async () => {
        try {
            setEnviando(true);
            const session = await getSession();
            if (!session?.accessToken) throw new Error('No estás autenticado');

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${API_URL}/solicitudes/${solicitud.id}/aprobar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`
                },
                body: JSON.stringify({
                    comentarios: motivoDecision || 'Solicitud aprobada por el operador luego de revisión completa',
                    criterios_aprobados: checklistDecision
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            // Actualizar estado local INMEDIATAMENTE
            console.log('✅ Solicitud aprobada, actualizando estado local...');
            setSolicitudYaRevisada(true);
            setEstadoActual('aprobado');

            setMensaje('. Solicitud aprobada exitosamente');
            if (onDecisionTomada) onDecisionTomada('aprobada', motivoDecision);

            // Refrescar dashboard del operador
            if (onDashboardActualizado) onDashboardActualizado();

            setTimeout(() => onClose(), 1500);

        } catch (error) {
            console.error('Error aprobando solicitud:', error);
            setMensaje(error instanceof Error ? error.message : 'Error al aprobar la solicitud');
        } finally {
            setEnviando(false);
        }
    };

    // Manejar rechazo con token seguro
    const handleRechazar = async () => {
        try {
            setEnviando(true);
            const session = await getSession();
            if (!session?.accessToken) throw new Error('No estás autenticado');

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${API_URL}/solicitudes/${solicitud.id}/rechazar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`
                },
                body: JSON.stringify({
                    motivo_rechazo: motivoDecision || 'Solicitud rechazada por el operador luego de revisión completa',
                    criterios_rechazo: checklistDecision
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            // Actualizar estado local INMEDIATAMENTE
            console.log('❌ Solicitud rechazada, actualizando estado local...');
            setSolicitudYaRevisada(true);
            setEstadoActual('rechazado');

            setMensaje('. Solicitud rechazada exitosamente');
            if (onDecisionTomada) onDecisionTomada('rechazada', motivoDecision);

            // Refrescar dashboard del operador
            if (onDashboardActualizado) onDashboardActualizado();

            setTimeout(() => onClose(), 1500);

        } catch (error) {
            console.error('Error rechazando solicitud:', error);
            setMensaje(error instanceof Error ? error.message : 'Error al rechazar la solicitud');
        } finally {
            setEnviando(false);
        }
    };

    // Manejar envío de comentario con token seguro
    const handleEnviarComentario = async () => {
        if (!comentario.trim()) return;

        try {
            setEnviando(true);
            
            const session = await getSession();
            if (!session?.accessToken) {
                throw new Error('No estás autenticado');
            }

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${API_URL}/comentarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`
                },
                body: JSON.stringify({
                    solicitud_id: solicitud.id,
                    comentario: comentario.trim(),
                    tipo: 'operador_a_solicitante'
                })
            });

            if (!response.ok) {
                throw new Error('Error al enviar comentario');
            }

            setMensaje('💬 Comentario enviado exitosamente');
            setComentario('');
            setDialogoComentario(false);
            
            if (onComentarioEnviado) {
                onComentarioEnviado(comentario);
            }
            
            setTimeout(() => setMensaje(''), 3000);
        } catch (error) {
            console.error('Error enviando comentario:', error);
            setMensaje('. Error al enviar comentario');
        } finally {
            setEnviando(false);
        }
    };

    // Abrir diálogo de decisión
    const handleAbrirDecision = (tipo: 'aprobacion' | 'rechazo') => {
        // Verificar nuevamente antes de abrir el diálogo
        if (solicitudYaRevisada) {
            setMensaje('⚠️ Esta solicitud ya ha sido revisada y no se pueden realizar más cambios');
            return;
        }
        
        setTipoDecision(tipo);
        setChecklistDecision({});
        setMotivoDecision('');
        setDialogoDecision(true);
    };

    // Cerrar diálogo de decisión
    const handleCerrarDecision = () => {
        setDialogoDecision(false);
        setTipoDecision(null);
        setChecklistDecision({});
        setMotivoDecision('');
    };

    // Manejar cambio en checklist de decisión
    const handleChecklistDecisionChange = (criterioId: string) => {
        setChecklistDecision(prev => ({
            ...prev,
            [criterioId]: !prev[criterioId]
        }));
    };

    // Confirmar decisión
    const handleConfirmarDecision = () => {
        // Verificar nuevamente antes de confirmar
        if (solicitudYaRevisada) {
            setMensaje('⚠️ Esta solicitud ya ha sido revisada y no se pueden realizar más cambios');
            handleCerrarDecision();
            return;
        }

        if (tipoDecision === 'aprobacion') {
            handleAprobar();
        } else if (tipoDecision === 'rechazo') {
            handleRechazar();
        }
        handleCerrarDecision();
    };

    // Obtener criterios según tipo de decisión
    const obtenerCriteriosDecision = () => {
        if (!tipoDecision) return { titulo: '', criterios: [] };
        return CRITERIOS_DECISION[tipoDecision] || { titulo: 'Criterios de Decisión', criterios: [] };
    };

    const criteriosActuales = obtenerCriteriosDecision();

    // Obtener texto del estado actual
    const obtenerTextoEstado = () => {
        switch (estadoActual) {
            case 'aprobado':
                return 'APROBADA';
            case 'rechazado':
                return 'RECHAZADA';
            default:
                return 'EN REVISIÓN';
        }
    };

    // Obtener color del estado actual
    const obtenerColorEstado = () => {
        switch (estadoActual) {
            case 'aprobado':
                return 'success';
            case 'rechazado':
                return 'error';
            default:
                return 'warning';
        }
    };

    // Verificar si los botones deben estar deshabilitados
    const botonesDeshabilitados = enviando || loading || solicitudYaRevisada;

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Decisión Final
            </Typography>

            {mensaje && (
                <Alert 
                    severity={mensaje.includes('.') ? 'error' : 'success'} 
                    sx={{ mb: 2 }}
                >
                    {mensaje}
                </Alert>
            )}

            {/* Indicador de estado actual */}
            {solicitudYaRevisada && (
                <Alert 
                    severity="info" 
                    sx={{ mb: 2 }}
                    icon={<Block />}
                >
                    <Typography variant="subtitle1" fontWeight="bold">
                        SOLICITUD {obtenerTextoEstado()}
                    </Typography>
                    <Typography variant="body2">
                        Esta solicitud ya ha sido {estadoActual === 'aprobado' ? 'aprobada' : 'rechazada'}. 
                        No se pueden realizar más cambios en la decisión.
                    </Typography>
                </Alert>
            )}

            {solicitud.scoring?.puntaje_total < 60 && !solicitudYaRevisada && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    🔴 Scoring bajo detectado. Se recomienda revisión exhaustiva antes de aprobar.
                </Alert>
            )}

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body1" gutterBottom>
                            Después de revisar toda la documentación e información, tome una decisión final sobre esta solicitud.
                        </Typography>
                        <Chip 
                            label={obtenerTextoEstado()}
                            color={obtenerColorEstado()}
                            variant="filled"
                            size="medium"
                        />
                    </Box>
                    
                    {solicitudYaRevisada && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            <strong>Decisión finalizada:</strong> Esta solicitud ya fue {estadoActual} y no puede ser modificada.
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Botones de decisión principal - CORREGIDOS */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
                <Button 
                    variant="contained" 
                    color="success"
                    size="large"
                    startIcon={solicitudYaRevisada ? <Block /> : <ThumbUp />}
                    onClick={() => handleAbrirDecision('aprobacion')}
                    disabled={botonesDeshabilitados}
                    sx={{ 
                        minWidth: 200,
                        opacity: solicitudYaRevisada ? 0.6 : 1,
                        cursor: solicitudYaRevisada ? 'not-allowed' : 'pointer'
                    }}
                >
                    {solicitudYaRevisada ? 'Ya Aprobada' : (enviando ? 'Procesando...' : 'Aprobar Solicitud')}
                </Button>
                
                <Button 
                    variant="contained" 
                    color="error"
                    size="large"
                    startIcon={solicitudYaRevisada ? <Block /> : <ThumbDown />}
                    onClick={() => handleAbrirDecision('rechazo')}
                    disabled={botonesDeshabilitados}
                    sx={{ 
                        minWidth: 200,
                        opacity: solicitudYaRevisada ? 0.6 : 1,
                        cursor: solicitudYaRevisada ? 'not-allowed' : 'pointer'
                    }}
                >
                    {solicitudYaRevisada ? 'Ya Rechazada' : (enviando ? 'Procesando...' : 'Rechazar Solicitud')}
                </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Diálogo para decisión con criterios - CORREGIDO */}
            <Dialog 
                open={dialogoDecision} 
                onClose={handleCerrarDecision}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        {tipoDecision === 'aprobacion' ? <ThumbUp color="success" /> : <ThumbDown color="error" />}
                        Confirmar {tipoDecision === 'aprobacion' ? 'Aprobación' : 'Rechazo'} - {solicitud.numero_solicitud}
                    </Box>
                </DialogTitle>
                
                <DialogContent dividers>
                    <Typography variant="h6" gutterBottom>
                        {criteriosActuales.titulo}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Marque los criterios que aplican para esta decisión:
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                        {criteriosActuales.criterios.map((criterio) => (
                            <Box 
                                key={criterio.id}
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'flex-start', 
                                    mb: 1, 
                                    p: 1,
                                    borderRadius: 1,
                                    bgcolor: checklistDecision[criterio.id] ? 'action.selected' : 'transparent'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={!!checklistDecision[criterio.id]}
                                    onChange={() => handleChecklistDecisionChange(criterio.id)}
                                    style={{ marginTop: '4px', marginRight: '8px' }}
                                    disabled={solicitudYaRevisada}
                                />
                                <Box>
                                    <Typography variant="body2" fontWeight="medium">
                                        {criterio.label}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {criterio.desc}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>
                        Comentarios adicionales sobre la decisión:
                    </Typography>
                    <TextField
                        multiline
                        rows={3}
                        fullWidth
                        value={motivoDecision}
                        onChange={(e) => setMotivoDecision(e.target.value)}
                        placeholder={`Explique los motivos de la ${tipoDecision === 'aprobacion' ? 'aprobación' : 'rechazo'}...`}
                        variant="outlined"
                        size="small"
                        disabled={solicitudYaRevisada}
                    />

                    {solicitudYaRevisada ? (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            <strong>Decisión finalizada:</strong> Esta solicitud ya fue {estadoActual} y no puede ser modificada.
                        </Alert>
                    ) : (
                        <Alert 
                            severity={tipoDecision === 'aprobacion' ? 'success' : 'error'} 
                            sx={{ mt: 2 }}
                        >
                            <strong>
                                {tipoDecision === 'aprobacion' 
                                    ? '¿Está seguro que desea APROBAR esta solicitud?' 
                                    : '¿Está seguro que desea RECHAZAR esta solicitud?'}
                            </strong>
                            <br />
                            Esta acción {tipoDecision === 'aprobacion' 
                                ? 'aprobará la solicitud y notificará al solicitante' 
                                : 'rechazará la solicitud y notificará al solicitante con los motivos indicados'}.
                        </Alert>
                    )}
                </DialogContent>
                
                <DialogActions>
                    <Button onClick={handleCerrarDecision} disabled={enviando}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleConfirmarDecision}
                        variant="contained"
                        color={tipoDecision === 'aprobacion' ? 'success' : 'error'}
                        disabled={enviando || solicitudYaRevisada}
                        startIcon={tipoDecision === 'aprobacion' ? <CheckCircle /> : <Cancel />}
                    >
                        {enviando ? 'Procesando...' : `Confirmar ${tipoDecision === 'aprobacion' ? 'Aprobación' : 'Rechazo'}`}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}