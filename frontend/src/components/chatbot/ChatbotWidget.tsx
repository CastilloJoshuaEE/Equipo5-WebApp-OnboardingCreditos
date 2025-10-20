// frontend/src/components/chatbot/ChatbotWidget.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { 
    Box, 
    Paper, 
    TextField, 
    IconButton, 
    Typography, 
    Avatar,
    CircularProgress,
    Collapse
} from '@mui/material';
import { 
    Send, 
    SmartToy, 
    Close
} from '@mui/icons-material';
import { getSession } from 'next-auth/react';

interface Mensaje {
    id: string;
    texto: string;
    esUsuario: boolean;
    timestamp: Date;
}

export default function ChatbotWidget() {
    const [abierto, setAbierto] = useState(false);
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [mensajeInput, setMensajeInput] = useState('');
    const [cargando, setCargando] = useState(false);
    const [session, setSession] = useState<any>(null);
    const mensajesEndRef = useRef<HTMLDivElement>(null);

    // Cargar session en useEffect
    useEffect(() => {
        const loadSession = async () => {
            const userSession = await getSession();
            setSession(userSession);
        };
        loadSession();
    }, []);

    const mensajeInicial: Mensaje = {
        id: '1',
        texto: '¡Hola! Soy tu asistente virtual de Nexia. ¿En qué puedo ayudarte con tu solicitud de crédito?',
        esUsuario: false,
        timestamp: new Date()
    };

    useEffect(() => {
        if (abierto && mensajes.length === 0) {
            setMensajes([mensajeInicial]);
        }
    }, [abierto]);

    useEffect(() => {
        scrollToBottom();
    }, [mensajes]);

    const scrollToBottom = () => {
        mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const enviarMensaje = async () => {
        if (!mensajeInput.trim() || cargando) return;

        const nuevoMensajeUsuario: Mensaje = {
            id: Date.now().toString(),
            texto: mensajeInput,
            esUsuario: true,
            timestamp: new Date()
        };

        setMensajes(prev => [...prev, nuevoMensajeUsuario]);
        setMensajeInput('');
        setCargando(true);

        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            
            // Preparar headers
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            // Si hay sesión, agregar el token de autorización
            if (session?.accessToken) {
                headers['Authorization'] = `Bearer ${session.accessToken}`;
            }

            const endpoint = session?.accessToken 
                ? `${API_BASE}/chatbot/mensaje-autenticado`
                : `${API_BASE}/chatbot/mensaje`;

            console.log('🤖 Enviando mensaje a:', endpoint);
            console.log('🤖 Token presente:', !!session?.accessToken);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ mensaje: mensajeInput }),
            });

            console.log('🤖 Respuesta del servidor:', response.status);

            if (!response.ok) {
                // Si es 401, intentar con endpoint público
                if (response.status === 401 && session?.accessToken) {
                    console.log('🤖 Token inválido, intentando con endpoint público...');
                    const publicResponse = await fetch(`${API_BASE}/chatbot/mensaje`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ mensaje: mensajeInput }),
                    });

                    if (publicResponse.ok) {
                        const publicData = await publicResponse.json();
                        const mensajeBot: Mensaje = {
                            id: (Date.now() + 1).toString(),
                            texto: publicData.data.respuesta,
                            esUsuario: false,
                            timestamp: new Date()
                        };
                        setMensajes(prev => [...prev, mensajeBot]);
                        return;
                    }
                }

                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(errorData.message || `Error ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                const mensajeBot: Mensaje = {
                    id: (Date.now() + 1).toString(),
                    texto: data.data.respuesta,
                    esUsuario: false,
                    timestamp: new Date()
                };
                setMensajes(prev => [...prev, mensajeBot]);
            } else {
                throw new Error(data.message || 'Error en la respuesta del servidor');
            }
        } catch (error: any) {
            console.error('❌ Error enviando mensaje:', error);
            const mensajeError: Mensaje = {
                id: (Date.now() + 1).toString(),
                texto: 'Lo siento, ha ocurrido un error. Por favor intenta nuevamente.',
                esUsuario: false,
                timestamp: new Date()
            };
            setMensajes(prev => [...prev, mensajeError]);
        } finally {
            setCargando(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensaje();
        }
    };

    return (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
            {/* Botón flotante */}
            {!abierto && (
                <IconButton
                    onClick={() => setAbierto(true)}
                    sx={{
                        backgroundColor: 'primary.main',
                        color: 'white',
                        width: 60,
                        height: 60,
                        '&:hover': {
                            backgroundColor: 'primary.dark',
                        },
                        boxShadow: 3,
                    }}
                >
                    <SmartToy />
                </IconButton>
            )}

            {/* Chatbox */}
            <Collapse in={abierto} orientation="vertical">
                <Paper 
                    elevation={8} 
                    sx={{ 
                        width: 350, 
                        height: 500, 
                        display: 'flex', 
                        flexDirection: 'column',
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >
                    {/* Header */}
                    <Box 
                        sx={{ 
                            backgroundColor: 'primary.main', 
                            color: 'white', 
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'white', color: 'primary.main' }}>
                                <SmartToy fontSize="small" />
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Asistente Nexia
                                </Typography>
                                <Typography variant="caption">
                                    {session ? `Conectado como ${session.user?.name}` : 'Modo invitado'}
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton 
                            size="small" 
                            sx={{ color: 'white' }}
                            onClick={() => setAbierto(false)}
                        >
                            <Close />
                        </IconButton>
                    </Box>

                    {/* Mensajes */}
                    <Box 
                        sx={{ 
                            flex: 1, 
                            p: 2, 
                            overflow: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            backgroundColor: 'grey.50'
                        }}
                    >
                        {mensajes.map((mensaje) => (
                            <Box
                                key={mensaje.id}
                                sx={{
                                    display: 'flex',
                                    justifyContent: mensaje.esUsuario ? 'flex-end' : 'flex-start',
                                    mb: 1
                                }}
                            >
                                <Paper
                                    sx={{
                                        p: 1.5,
                                        maxWidth: '80%',
                                        backgroundColor: mensaje.esUsuario ? 'primary.main' : 'white',
                                        color: mensaje.esUsuario ? 'white' : 'text.primary',
                                        borderRadius: 2,
                                        boxShadow: 1
                                    }}
                                >
                                    <Typography variant="body2">
                                        {mensaje.texto}
                                    </Typography>
                                    <Typography 
                                        variant="caption" 
                                        sx={{ 
                                            display: 'block',
                                            mt: 0.5,
                                            opacity: 0.7,
                                            textAlign: 'right'
                                        }}
                                    >
                                        {mensaje.timestamp.toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </Typography>
                                </Paper>
                            </Box>
                        ))}
                        {cargando && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <Paper sx={{ p: 1.5, borderRadius: 2 }}>
                                    <CircularProgress size={20} />
                                </Paper>
                            </Box>
                        )}
                        <div ref={mensajesEndRef} />
                    </Box>

                    {/* Input */}
                    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Escribe tu mensaje..."
                                value={mensajeInput}
                                onChange={(e) => setMensajeInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={cargando}
                                multiline
                                maxRows={3}
                            />
                            <IconButton 
                                onClick={enviarMensaje}
                                disabled={!mensajeInput.trim() || cargando}
                                color="primary"
                            >
                                <Send />
                            </IconButton>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Asistente especializado en créditos para PYMES
                        </Typography>
                    </Box>
                </Paper>
            </Collapse>
        </Box>
    );
}