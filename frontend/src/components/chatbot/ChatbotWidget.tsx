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
  Card,
  CardContent
} from '@mui/material';
import { 
  Send, 
  SmartToy, 
  Close,
  HelpOutline
} from '@mui/icons-material';
import { getSession, useSession } from 'next-auth/react';
import './chabot-styles.css';
import { Mensaje } from '@/features/chatbot/mensaje.types';

export default function ChatbotWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [mensajeInput, setMensajeInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  // Usar useSession para obtener la sesión de manera reactiva
  const { data: sessionData, status } = useSession();

  // Efecto para sincronizar la sesión
  useEffect(() => {
    const loadSession = async () => {
      setSessionLoading(true);
      try {
        const userSession = await getSession();
        console.log('. Chatbot - Sesión cargada:', userSession ? `Usuario: ${userSession.user?.name}` : 'No hay sesión');
        setSession(userSession);
      } catch (error) {
        console.error('Error cargando sesión en chatbot:', error);
      } finally {
        setSessionLoading(false);
      }
    };

    loadSession();
  }, []);

  // Escuchar cambios en la sesión de useSession
  useEffect(() => {
    if (status === 'authenticated') {
      console.log('. Chatbot - Sesión autenticada detectada:', sessionData?.user?.name);
      setSession(sessionData);
    } else if (status === 'unauthenticated') {
      console.log('🚪 Chatbot - Sesión no autenticada');
      setSession(null);
    }
  }, [sessionData, status]);

  // Escuchar eventos de storage para detectar cambios de sesión
  useEffect(() => {
    const handleStorageChange = async () => {
      console.log('📦 Chatbot - Cambio en storage detectado, recargando sesión...');
      const userSession = await getSession();
      setSession(userSession);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 Chatbot - Página visible, verificando sesión...');
        getSession().then(userSession => {
          setSession(userSession);
        });
      }
    };

    // Suscribirse a eventos
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const mensajeInicial: Mensaje = {
    id: '1',
    texto: session 
      ? `¡Hola ${session.user?.name}! Soy tu asistente virtual de Nexia. ¿En qué puedo ayudarte con tu solicitud de crédito?` 
      : '¡Hola! Soy tu asistente virtual de Nexia. ¿En qué puedo ayudarte con tu solicitud de crédito?',
    esUsuario: false,
    timestamp: new Date()
  };

  useEffect(() => {
    if (abierto && mensajes.length === 0 && !sessionLoading) {
      setMensajes([mensajeInicial]);
    }
  }, [abierto, sessionLoading]);

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
      // Verificar sesión actualizada antes de enviar
      const currentSession = await getSession();
      setSession(currentSession);

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (currentSession?.accessToken) {
        headers['Authorization'] = `Bearer ${currentSession.accessToken}`;
      }

      const endpoint = currentSession?.accessToken 
        ? `${API_BASE}/chatbot/mensaje-autenticado`
        : `${API_BASE}/chatbot/mensaje`;

      console.log(' Chatbot - Enviando mensaje:', {
        endpoint,
        autenticado: !!currentSession?.accessToken,
        usuario: currentSession?.user?.name
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ 
          mensaje: mensajeInput,
          usuario_id: currentSession?.user?.id,
          rol: currentSession?.user?.rol
        }),
      });

      console.log('Chatbot - Respuesta del servidor:', response.status);

      if (!response.ok) {
        if (response.status === 401 && currentSession?.accessToken) {
          console.log('. Chatbot - Token inválido, intentando con endpoint público...');
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
      console.error('. Chatbot - Error enviando mensaje:', error);
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

  // Función para forzar actualización de sesión
  const actualizarSesion = async () => {
    console.log('. Chatbot - Forzando actualización de sesión...');
    const nuevaSesion = await getSession();
    setSession(nuevaSesion);
  };

  return (
    <Box className="chatbot-container">
      {/* Botón flotante */}
      {!abierto && (
        <IconButton
          onClick={() => {
            setAbierto(true);
            actualizarSesion(); // Actualizar sesión al abrir
          }}
          className="floating-chat-button"
          sx={{
            '& .MuiSvgIcon-root': {
              color: 'white !important',
              fontSize: '28px'
            }
          }}
        >
          <SmartToy />
        </IconButton>
      )}

      {/* Chatbox - Renderizado condicional en lugar de Collapse */}
      {abierto && (
        <Card className="chatbot-card">
          <CardContent className="chatbot-content">
            {/* Header */}
            <Box className="chatbot-header">
              <Box className="chatbot-info">
                <Avatar className="chatbot-avatar">
                  <SmartToy />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" className="chatbot-title">
                    Asistente Nexia
                  </Typography>
                  <Typography variant="caption" className="chatbot-subtitle">
                    {sessionLoading ? (
                      <CircularProgress size={12} />
                    ) : session ? (
                      `Conectado como ${session.user?.name} (${session.user?.rol})`
                    ) : (
                      'Modo invitado'
                    )}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                
                <IconButton 
                  size="small" 
                  onClick={() => setAbierto(false)}
                  className="close-button"
                >
                  <Close />
                </IconButton>
              </Box>
            </Box>

            {/* Mensajes */}
            <Box className="messages-container">
              {mensajes.map((mensaje) => (
                <Box
                  key={mensaje.id}
                  className={`message-bubble ${mensaje.esUsuario ? 'user-message' : 'bot-message'}`}
                >
                  <Paper className="message-paper">
                    <Typography variant="body2" className="message-text">
                      {mensaje.texto}
                    </Typography>
                    <Typography variant="caption" className="message-time">
                      {mensaje.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                  </Paper>
                </Box>
              ))}
              {cargando && (
                <Box className="message-bubble bot-message">
                  <Paper className="message-paper loading-paper">
                    <CircularProgress size={20} />
                  </Paper>
                </Box>
              )}
              <div ref={mensajesEndRef} />
            </Box>

            {/* Input */}
            <Box className="input-container">
              <Box className="input-wrapper">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Escribe tu mensaje..."
                  value={mensajeInput}
                  onChange={(e) => setMensajeInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={cargando || sessionLoading}
                  multiline
                  maxRows={3}
                  className="message-input"
                />
                <IconButton 
                  onClick={enviarMensaje}
                  disabled={!mensajeInput.trim() || cargando || sessionLoading}
                  className="send-button"
                >
                  <Send />
                </IconButton>
              </Box>
              <Typography variant="caption" className="input-help">
                {session ? 'Asistente especializado en créditos para PYMES' : 'Inicia sesión para una experiencia personalizada'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}