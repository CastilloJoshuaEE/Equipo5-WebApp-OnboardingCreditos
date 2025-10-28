// components/FirmaDigital/FirmaDigitalStatus.tsx
import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Card, 
    CardContent, 
    Typography, 
    Button, 
    Alert, 
    LinearProgress,
    Chip,
    Stack,
    Divider
} from '@mui/material';
import { 
    CheckCircle, 
    Schedule, 
    Error as ErrorIcon,
    Pending,
    Download,
    Refresh
} from '@mui/icons-material';
import { getSession } from 'next-auth/react';

interface FirmaDigitalStatusProps {
    firmaId: string;
    solicitudId: string;
}

interface FirmaData {
    firma: {
        id: string;
        estado: string;
        fecha_envio: string;
        fecha_expiracion: string;
        fecha_firma_solicitante?: string;
        fecha_firma_operador?: string;
        fecha_firma_completa?: string;
        url_firma_solicitante?: string;
        url_firma_operador?: string;
        url_documento_firmado?: string;
        integridad_valida?: boolean;
    };
}

const FirmaDigitalStatus: React.FC<FirmaDigitalStatusProps> = ({ firmaId, solicitudId }) => {
    const [firmaData, setFirmaData] = useState<FirmaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        cargarEstadoFirma();
        const interval = setInterval(cargarEstadoFirma, 30000); // Actualizar cada 30 segundos
        return () => clearInterval(interval);
    }, [firmaId]);

    const cargarEstadoFirma = async () => {
        try {
            const session = await getSession();
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            
            const response = await fetch(`${API_URL}/firmas/${firmaId}/estado`, {
                headers: { 
                    Authorization: `Bearer ${session?.accessToken}`, 
                    'Content-Type': 'application/json' 
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                setFirmaData(result.data);
                setError(null);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Error cargando estado de firma');
        } finally {
            setLoading(false);
        }
    };

const verificarIntegridadCompleta = async () => {
    try {
        const session = await getSession();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        const response = await fetch(`${API_URL}/firmas/${firmaId}/verificar-integridad`, {
            headers: { 
                Authorization: `Bearer ${session?.accessToken}`, 
                'Content-Type': 'application/json' 
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Actualizar el estado local con la integridad
            setFirmaData(prev => prev ? {
                ...prev,
                firma: {
                    ...prev.firma,
                    integridad_valida: result.data.integridad_valida
                }
            } : null);
            
            return result.data.integridad_valida;
        }
        return false;
    } catch (err) {
        console.error('Error verificando integridad:', err);
        return false;
    }
};

// Llamar esta función cuando se cargue el estado
useEffect(() => {
    if (firmaData?.firma && !firmaData.firma.integridad_valida) {
        verificarIntegridadCompleta();
    }
}, [firmaData]);
    const getEstadoConfig = (estado: string) => {
        const configs: { [key: string]: { color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'; text: string; icon: React.ReactNode } } = {
            'pendiente': { 
                color: 'default', 
                text: 'Pendiente', 
                icon: <Pending /> 
            },
            'enviado': { 
                color: 'info', 
                text: 'Enviado', 
                icon: <Schedule /> 
            },
            'firmado_solicitante': { 
                color: 'success', 
                text: 'Solicitante Firmó', 
                icon: <CheckCircle /> 
            },
            'firmado_operador': { 
                color: 'success', 
                text: 'Operador Firmó', 
                icon: <CheckCircle /> 
            },
            'firmado_completo': { 
                color: 'success', 
                text: 'Completado', 
                icon: <CheckCircle /> 
            },
            'rechazado': { 
                color: 'error', 
                text: 'Rechazado', 
                icon: <ErrorIcon /> 
            },
            'expirado': { 
                color: 'warning', 
                text: 'Expirado', 
                icon: <ErrorIcon /> 
            },
            'error': { 
                color: 'error', 
                text: 'Error', 
                icon: <ErrorIcon /> 
            }
        };
        return configs[estado] || configs.pendiente;
    };

    const renderTimeline = () => {
        if (!firmaData) return null;

        const eventos = [];

        // Proceso iniciado
        eventos.push({
            fecha: firmaData.firma.fecha_envio,
            titulo: 'Proceso Iniciado',
            descripcion: 'Solicitud de firma enviada'
        });

        // Firma del solicitante
        if (firmaData.firma.fecha_firma_solicitante) {
            eventos.push({
                fecha: firmaData.firma.fecha_firma_solicitante,
                titulo: 'Solicitante Firmó',
                descripcion: 'El solicitante completó la firma'
            });
        }

        // Firma del operador
        if (firmaData.firma.fecha_firma_operador) {
            eventos.push({
                fecha: firmaData.firma.fecha_firma_operador,
                titulo: 'Operador Firmó',
                descripcion: 'El operador completó la firma'
            });
        }

        // Firma completa
        if (firmaData.firma.fecha_firma_completa) {
            eventos.push({
                fecha: firmaData.firma.fecha_firma_completa,
                titulo: 'Firma Completa',
                descripcion: 'Proceso de firma finalizado'
            });
        }

        return (
            <Stack spacing={2}>
                {eventos.map((evento, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CheckCircle color="success" />
                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                                {evento.titulo}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {new Date(evento.fecha).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {evento.descripcion}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Stack>
        );
    };

    const reenviarSolicitud = async () => {
        try {
            const session = await getSession();
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            
            const response = await fetch(`${API_URL}/firmas/${firmaId}/reenviar`, {
                method: 'POST',
                headers: { 
                    Authorization: `Bearer ${session?.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                cargarEstadoFirma(); // Recargar estado
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Error reenviando solicitud');
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <LinearProgress sx={{ width: '100%' }} />
                        <Typography>Cargando estado de firma digital...</Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert severity="error">
                {error}
            </Alert>
        );
    }

    if (!firmaData) {
        return (
            <Alert severity="warning">
                No se encontró información de la firma
            </Alert>
        );
    }

    const estadoConfig = getEstadoConfig(firmaData.firma.estado);

    return (
        <Card>
            <CardContent>
                {/* Encabezado */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" component="h2">
                        Estado de Firma Digital
                    </Typography>
                    <Chip 
                        label={estadoConfig.text}
                        color={estadoConfig.color}
                        variant="outlined"
                    />
                </Box>

                <Stack spacing={3}>
                    {/* Información de estado */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Información de Firma
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                            <Box>
                                <Typography variant="body2"><strong>Estado:</strong> {estadoConfig.text}</Typography>
                                <Typography variant="body2">
                                    <strong>Enviado:</strong> {new Date(firmaData.firma.fecha_envio).toLocaleString()}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Expira:</strong> {new Date(firmaData.firma.fecha_expiracion).toLocaleString()}
                                </Typography>
                            </Box>
                            
                            <Box>
                                <Typography variant="body2" fontWeight="bold" gutterBottom>
                                    Enlaces de Firma
                                </Typography>
                                {firmaData.firma.url_firma_solicitante && (
                                    <Button 
                                        variant="text" 
                                        href={firmaData.firma.url_firma_solicitante}
                                        target="_blank"
                                        size="small"
                                    >
                                        Firma Solicitante
                                    </Button>
                                )}
                                {firmaData.firma.url_firma_operador && (
                                    <Button 
                                        variant="text" 
                                        href={firmaData.firma.url_firma_operador}
                                        target="_blank"
                                        size="small"
                                        sx={{ ml: 1 }}
                                    >
                                        Firma Operador
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    <Divider />

                    {/* Línea de tiempo */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Progreso de Firma
                        </Typography>
                        {renderTimeline()}
                    </Box>

                    {/* Validación de integridad */}
                    {firmaData.firma.integridad_valida !== undefined && (
                        <Alert
                            severity={firmaData.firma.integridad_valida ? "success" : "warning"}
                        >
                            {firmaData.firma.integridad_valida 
                                ? "El documento firmado coincide con el original. Integridad verificada."
                                : "Advertencia: El documento firmado no coincide con el original."
                            }
                        </Alert>
                    )}

                    {/* Acciones */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button 
                            startIcon={<Refresh />}
                            onClick={cargarEstadoFirma}
                            variant="outlined"
                            size="small"
                        >
                            Actualizar
                        </Button>
                        
                        {firmaData.firma.estado === 'expirado' && (
                            <Button 
                                variant="contained" 
                                onClick={reenviarSolicitud}
                                size="small"
                            >
                                Reenviar Solicitud
                            </Button>
                        )}
                        
                        <Button 
                            startIcon={<Download />}
                            onClick={() => window.open(firmaData.firma.url_documento_firmado, '_blank')}
                            disabled={!firmaData.firma.url_documento_firmado}
                            variant="outlined"
                            size="small"
                        >
                            Ver Documento Firmado
                        </Button>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default FirmaDigitalStatus;