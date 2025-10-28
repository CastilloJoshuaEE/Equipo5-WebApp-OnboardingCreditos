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
  Collapse,
  Card,
  CardContent
} from '@mui/material';
import { 
  Send, 
  SmartToy, 
  Close,
  HelpOutline
} from '@mui/icons-material';
import { getSession } from 'next-auth/react';
import './chabot-styles.css';

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

      console.log('. Enviando mensaje a:', endpoint);
      console.log('. Token presente:', !!session?.accessToken);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ mensaje: mensajeInput }),
      });

      console.log('. Respuesta del servidor:', response.status);

      if (!response.ok) {
        // Si es 401, intentar con endpoint público
        if (response.status === 401 && session?.accessToken) {
          console.log('. Token inválido, intentando con endpoint público...');
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
      console.error('. Error enviando mensaje:', error);
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
    <Box className="chatbot-container">
      {/* Botón flotante */}
      {!abierto && (
        <IconButton
          onClick={() => setAbierto(true)}
          className="floating-chat-button"
        >
          <HelpOutline />
        </IconButton>
      )}

      {/* Chatbox */}
      <Collapse in={abierto} orientation="vertical">
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
                    {session ? `Conectado como ${session.user?.name}` : 'Modo invitado'}
                  </Typography>
                </Box>
              </Box>
              <IconButton 
                size="small" 
                onClick={() => setAbierto(false)}
                className="close-button"
              >
                <Close />
              </IconButton>
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
                  disabled={cargando}
                  multiline
                  maxRows={3}
                  className="message-input"
                />
                <IconButton 
                  onClick={enviarMensaje}
                  disabled={!mensajeInput.trim() || cargando}
                  className="send-button"
                >
                  <Send />
                </IconButton>
              </Box>
              <Typography variant="caption" className="input-help">
                Asistente especializado en créditos para PYMES
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Collapse>
    </Box>
  );
}