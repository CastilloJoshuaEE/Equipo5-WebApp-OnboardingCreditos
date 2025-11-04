'use client';
import React, { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Typography,
  Box,
  Chip
} from '@mui/material';

interface ConfiguracionCuenta {
  email_principal: string;
  email_recuperacion?: string;
  cuenta_activa: boolean;
  fecha_desactivacion?: string;
}

export default function EmailRecuperacionForm() {
  const [emailRecuperacion, setEmailRecuperacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [configuracion, setConfiguracion] = useState<ConfiguracionCuenta | null>(null);
  const [cargandoConfiguracion, setCargandoConfiguracion] = useState(true);

  // Cargar configuración al montar el componente
  useEffect(() => {
    cargarConfiguracionCuenta();
  }, []);

  const cargarConfiguracionCuenta = async () => {
    try {
      const session = await getSession();
      if (!session?.accessToken) {
        setError('No estás autenticado');
        setCargandoConfiguracion(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/usuario/configuracion-cuenta`, 
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConfiguracion(data.data);
        setCurrentEmail(data.data.email_principal);
        setEmailRecuperacion(data.data.email_recuperacion || '');
      } else {
        console.error('Error cargando configuración:', response.status);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setCargandoConfiguracion(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación .
    if (!emailRecuperacion) {
      setError('El email de recuperación es requerido');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailRecuperacion)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    // No permitir el mismo email principal
    if (emailRecuperacion === currentEmail) {
      setError('El email de recuperación no puede ser igual al email principal');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const session = await getSession();
      
      if (!session?.accessToken) {
        setError('No estás autenticado. Por favor inicia sesión nuevamente.');
        setLoading(false);
        return;
      }

      console.log('Enviando solicitud para actualizar email de recuperación...');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/usuario/email-recuperacion`, 
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ 
            email_recuperacion: emailRecuperacion 
          }),
        }
      );

      console.log('Respuesta del servidor:', response.status);

      const data = await response.json();
      console.log('Datos de respuesta:', data);

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      if (data.success) {
        setMessage('Email de recuperación actualizado exitosamente');
        // Recargar la configuración para mostrar el nuevo email
        await cargarConfiguracionCuenta();
      } else {
        setError(data.message || 'Error al actualizar el email de recuperación');
      }
    } catch (error: any) {
      console.error('Error completo:', error);
      setError(error.message || 'Error de conexión al actualizar el email');
    } finally {
      setLoading(false);
    }
  };

  if (cargandoConfiguracion) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Email de recuperación
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cargando configuración...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Configuración de cuenta
        </Typography>
        
        {/* Email Principal */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Email principal
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1">
              {configuracion?.email_principal}
            </Typography>
            <Chip 
              label="Principal" 
              color="primary" 
              size="small" 
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Email de Recuperación */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Email de recuperación
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Establece un email alternativo para recuperar tu cuenta en caso de perder el acceso.
          </Typography>
          
          {configuracion?.email_recuperacion && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Email de recuperación actual:</strong> {configuracion.email_recuperacion}
                </Typography>
              </Alert>
            </Box>
          )}
        </Box>
        
        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Nuevo email de recuperación"
            type="email"
            fullWidth
            value={emailRecuperacion}
            onChange={(e) => setEmailRecuperacion(e.target.value)}
            margin="normal"
            placeholder="ejemplo@email.com"
            helperText="Este email se usará para recuperar tu cuenta si pierdes el acceso"
            disabled={loading}
            error={!!error}
          />
          <Button 
            type="submit"
            variant="contained"
            disabled={loading || !emailRecuperacion}
            sx={{ mt: 2 }}
          >
            {loading ? 'Actualizando...' : configuracion?.email_recuperacion ? 'Actualizar email de recuperación' : 'Establecer email de recuperación'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}