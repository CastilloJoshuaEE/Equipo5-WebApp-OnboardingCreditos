// frontend/src/components/operador/steps/DecisionStep.tsx
'use client';
import React, { useState } from 'react';
import { getSession } from 'next-auth/react';
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
    ThumbDown
} from '@mui/icons-material';

interface DecisionStepProps {
    solicitud: any;
    onClose: () => void;
    onComentarioEnviado?: (comentario: string) => void;
    onDecisionTomada?: (decision: string, motivo?: string) => void;
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
    loading = false 
}: DecisionStepProps) {
    const [dialogoComentario, setDialogoComentario] = useState(false);
    const [dialogoDecision, setDialogoDecision] = useState(false);
    const [tipoDecision, setTipoDecision] = useState<'aprobacion' | 'rechazo' | null>(null);
    const [comentario, setComentario] = useState('');
    const [motivoDecision, setMotivoDecision] = useState('');
    const [checklistDecision, setChecklistDecision] = useState<{[key: string]: boolean}>({});
    const [enviando, setEnviando] = useState(false);
    const [mensaje, setMensaje] = useState('');

    // Calcular progreso de documentación
    const calcularProgresoDocumentacion = () => {
        if (!solicitud.documentos || solicitud.documentos.length === 0) return 0;
        
        const documentosValidados = solicitud.documentos.filter((doc: any) => 
            doc.estado === 'validado'
        ).length;
        
        return (documentosValidados / solicitud.documentos.length) * 100;
    };

    const progresoDocumentacion = calcularProgresoDocumentacion();

    // Manejar aprobación con token seguro
    const handleAprobar = async () => {
        try {
            setEnviando(true);
            
            const session = await getSession();
            if (!session?.accessToken) {
                throw new Error('No estás autenticado');
            }

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

            setMensaje('✅ Solicitud aprobada exitosamente');
            
            if (onDecisionTomada) {
                onDecisionTomada('aprobada', motivoDecision);
            }
            
            setTimeout(() => {
                onClose();
            }, 2000);
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
            if (!session?.accessToken) {
                throw new Error('No estás autenticado');
            }

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

            setMensaje('❌ Solicitud rechazada exitosamente');
            
            if (onDecisionTomada) {
                onDecisionTomada('rechazada', motivoDecision);
            }
            
            setTimeout(() => {
                onClose();
            }, 2000);
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
            setMensaje('❌ Error al enviar comentario');
        } finally {
            setEnviando(false);
        }
    };

    // Abrir diálogo de decisión
    const handleAbrirDecision = (tipo: 'aprobacion' | 'rechazo') => {
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

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Decisión Final
            </Typography>

            {mensaje && (
                <Alert 
                    severity={mensaje.includes('❌') ? 'error' : 'success'} 
                    sx={{ mb: 2 }}
                >
                    {mensaje}
                </Alert>
            )}


            {solicitud.scoring?.puntaje_total < 60 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    🔴 Scoring bajo detectado. Se recomienda revisión exhaustiva antes de aprobar.
                </Alert>
            )}

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="body1" gutterBottom>
                        Después de revisar toda la documentación e información, tome una decisión final sobre esta solicitud.
                    </Typography>
                </CardContent>
            </Card>

            {/* Botones de decisión principal */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
                <Button 
                    variant="contained" 
                    color="success"
                    size="large"
                    startIcon={<ThumbUp />}
                    onClick={() => handleAbrirDecision('aprobacion')}
                    disabled={enviando || loading}
                    sx={{ minWidth: 200 }}
                >
                    {enviando ? 'Procesando...' : 'Aprobar Solicitud'}
                </Button>
                
                <Button 
                    variant="contained" 
                    color="error"
                    size="large"
                    startIcon={<ThumbDown />}
                    onClick={() => handleAbrirDecision('rechazo')}
                    disabled={enviando || loading}
                    sx={{ minWidth: 200 }}
                >
                    {enviando ? 'Procesando...' : 'Rechazar Solicitud'}
                </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Acción secundaria - Comentarios */}
            <Box sx={{ textAlign: 'center' }}>
                <Button 
                    variant="outlined"
                    size="large"
                    startIcon={<Comment />}
                    onClick={() => setDialogoComentario(true)}
                    disabled={enviando || loading}
                >
                    Enviar Comentarios al Solicitante
                </Button>
                
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    Puede enviar comentarios adicionales al solicitante sin tomar una decisión final
                </Typography>
            </Box>

            {/* Diálogo para comentarios */}
            <Dialog 
                open={dialogoComentario} 
                onClose={() => !enviando && setDialogoComentario(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Comment />
                        Enviar Comentario al Solicitante
                    </Box>
                </DialogTitle>
                
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Este comentario será visible para el solicitante de la solicitud {solicitud.numero_solicitud}.
                    </Typography>
                    
                    <TextField
                        multiline
                        rows={4}
                        fullWidth
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder="Escriba aquí sus comentarios, observaciones o solicitudes de información adicional..."
                        variant="outlined"
                        disabled={enviando}
                    />
                </DialogContent>
                
                <DialogActions>
                    <Button 
                        onClick={() => setDialogoComentario(false)} 
                        disabled={enviando}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleEnviarComentario}
                        variant="contained"
                        disabled={enviando || !comentario.trim()}
                        startIcon={<Send />}
                    >
                        {enviando ? 'Enviando...' : 'Enviar Comentario'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo para decisión con criterios */}
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
                    />

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
                </DialogContent>
                
                <DialogActions>
                    <Button onClick={handleCerrarDecision} disabled={enviando}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleConfirmarDecision}
                        variant="contained"
                        color={tipoDecision === 'aprobacion' ? 'success' : 'error'}
                        disabled={enviando}
                        startIcon={tipoDecision === 'aprobacion' ? <CheckCircle /> : <Cancel />}
                    >
                        {enviando ? 'Procesando...' : `Confirmar ${tipoDecision === 'aprobacion' ? 'Aprobación' : 'Rechazo'}`}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}