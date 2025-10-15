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
    Box
} from '@mui/material';

export default function EmailRecuperacionForm() {
    const [emailRecuperacion, setEmailRecuperacion] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [currentEmail, setCurrentEmail] = useState('');

    // Cargar el email actual al montar el componente
    useEffect(() => {
        loadCurrentEmail();
    }, []);

    const loadCurrentEmail = async () => {
        try {
            const session = await getSession();
            if (session?.user?.email) {
                setCurrentEmail(session.user.email);
            }
        } catch (error) {
            console.error('Error cargando email actual:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validación mejorada
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
                setEmailRecuperacion('');
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

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Email de Recuperación
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Establece un email alternativo para recuperar tu cuenta en caso de perder el acceso.
                    {currentEmail && (
                        <><br /><strong>Email principal:</strong> {currentEmail}</>
                    )}
                </Typography>
                
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
                        label="Email de recuperación"
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
                        {loading ? 'Actualizando...' : 'Guardar Email de Recuperación'}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
}