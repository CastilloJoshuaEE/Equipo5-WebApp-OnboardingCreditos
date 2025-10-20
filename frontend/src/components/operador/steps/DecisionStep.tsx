// frontend/src/components/operador/steps/DecisionStep.tsx
import React, { useState } from 'react';
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
    Divider
} from '@mui/material';
import { CheckCircle, Cancel, Comment, Send } from '@mui/icons-material';

interface DecisionStepProps {
    solicitud: any;
    onClose: () => void;
    onComentarioEnviado?: (comentario: string) => void;
}

export default function DecisionStep({ solicitud, onClose, onComentarioEnviado }: DecisionStepProps) {
    const [dialogoComentario, setDialogoComentario] = useState(false);
    const [comentario, setComentario] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [mensaje, setMensaje] = useState('');

    const handleAprobar = async () => {
        try {
            setEnviando(true);
            // Lógica para aprobar solicitud
            console.log('Aprobando solicitud:', solicitud.id);
            
            // Aquí iría la llamada a la API para aprobar
            const response = await fetch(`/api/solicitudes/${solicitud.id}/aprobar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    comentarios: 'Solicitud aprobada por el operador'
                })
            });

            if (response.ok) {
                setMensaje('. Solicitud aprobada exitosamente');
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                throw new Error('Error al aprobar solicitud');
            }
        } catch (error) {
            console.error('Error aprobando solicitud:', error);
            setMensaje('. Error al aprobar la solicitud');
        } finally {
            setEnviando(false);
        }
    };

    const handleRechazar = async () => {
        try {
            setEnviando(true);
            // Lógica para rechazar solicitud
            console.log('Rechazando solicitud:', solicitud.id);
            
            const response = await fetch(`/api/solicitudes/${solicitud.id}/rechazar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    motivo_rechazo: 'Solicitud rechazada por el operador'
                })
            });

            if (response.ok) {
                setMensaje('. Solicitud rechazada exitosamente');
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                throw new Error('Error al rechazar solicitud');
            }
        } catch (error) {
            console.error('Error rechazando solicitud:', error);
            setMensaje('. Error al rechazar la solicitud');
        } finally {
            setEnviando(false);
        }
    };

    const handleEnviarComentario = async () => {
        if (!comentario.trim()) return;

        try {
            setEnviando(true);
            
            const response = await fetch('/api/comentarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    solicitud_id: solicitud.id,
                    comentario: comentario.trim(),
                    tipo: 'operador_a_solicitante'
                })
            });

            if (response.ok) {
                setMensaje('💬 Comentario enviado exitosamente');
                setComentario('');
                setDialogoComentario(false);
                
                if (onComentarioEnviado) {
                    onComentarioEnviado(comentario);
                }
                
                setTimeout(() => setMensaje(''), 3000);
            } else {
                throw new Error('Error al enviar comentario');
            }
        } catch (error) {
            console.error('Error enviando comentario:', error);
            setMensaje('. Error al enviar comentario');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Decisión Final
            </Typography>

            {mensaje && (
                <Alert severity={mensaje.includes('.') ? 'error' : 'success'} sx={{ mb: 2 }}>
                    {mensaje}
                </Alert>
            )}

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="body1" gutterBottom>
                        Después de revisar toda la documentación e información, tome una decisión final sobre esta solicitud.
                    </Typography>
                    
                    <Box sx={{ mt: 2, spaceY: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" component="span">
                                <strong>Solicitud:</strong>
                            </Typography>
                            <Chip label={solicitud.numero_solicitud} size="small" />
                        </Box>
                        <Typography variant="body2">
                            <strong>Empresa:</strong> {solicitud.solicitantes?.nombre_empresa}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Monto:</strong> ${solicitud.monto?.toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Contacto:</strong> {solicitud.solicitantes?.usuarios?.nombre_completo}
                        </Typography>
                    </Box> {/* <- Este era el Box que faltaba cerrar */}
                </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
                <Button 
                    variant="contained" 
                    color="success"
                    size="large"
                    startIcon={<CheckCircle />}
                    onClick={handleAprobar}
                    disabled={enviando}
                    sx={{ minWidth: 200 }}
                >
                    {enviando ? 'Procesando...' : 'Aprobar Solicitud'}
                </Button>
                
                <Button 
                    variant="contained" 
                    color="error"
                    size="large"
                    startIcon={<Cancel />}
                    onClick={handleRechazar}
                    disabled={enviando}
                    sx={{ minWidth: 200 }}
                >
                    {enviando ? 'Procesando...' : 'Rechazar Solicitud'}
                </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ textAlign: 'center' }}>
                <Button 
                    variant="outlined"
                    size="large"
                    startIcon={<Comment />}
                    onClick={() => setDialogoComentario(true)}
                    disabled={enviando}
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
        </Box>
    );
}