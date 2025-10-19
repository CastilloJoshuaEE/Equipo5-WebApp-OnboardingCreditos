// frontend/src/components/operador/steps/ResumenStep.tsx
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid';
import { SolicitudOperador } from '@/types/operador';

interface ResumenStepProps {
    solicitud: SolicitudOperador;
}

export default function ResumenStep({ solicitud }: ResumenStepProps) {
    // Función segura para acceder a los datos anidados
    const getContactoInfo = () => {
        if (!solicitud?.solicitantes?.usuarios) {
            return {
                nombre_completo: 'No disponible',
                email: 'No disponible',
                telefono: 'No disponible'
            };
        }

        const usuario = Array.isArray(solicitud.solicitantes.usuarios) 
            ? solicitud.solicitantes.usuarios[0] 
            : solicitud.solicitantes.usuarios;

        return {
            nombre_completo: usuario?.nombre_completo || 'No disponible',
            email: usuario?.email || 'No disponible',
            telefono: usuario?.telefono || 'No disponible'
        };
    };

    const contacto = getContactoInfo();

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Resumen de la Solicitud
            </Typography>
            
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom color="primary">
                                Información de la Empresa
                            </Typography>
                            <Typography variant="body2">
                                <strong>Nombre:</strong> {solicitud.solicitantes?.nombre_empresa || 'No disponible'}
                            </Typography>
                            <Typography variant="body2">
                                <strong>CUIT:</strong> {solicitud.solicitantes?.cuit || 'No disponible'}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Representante Legal:</strong> {solicitud.solicitantes?.representante_legal || 'No disponible'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom color="primary">
                                Información de Contacto
                            </Typography>
                            <Typography variant="body2">
                                <strong>Contacto:</strong> {contacto.nombre_completo}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Email:</strong> {contacto.email}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Teléfono:</strong> {contacto.telefono}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom color="primary">
                                Detalles del Crédito
                            </Typography>
                            <Typography variant="body2">
                                <strong>Monto:</strong> ${solicitud.monto?.toLocaleString() || '0'}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Plazo:</strong> {solicitud.plazo_meses || '0'} meses
                            </Typography>
                            <Typography variant="body2">
                                <strong>Estado:</strong> {solicitud.estado || 'No disponible'}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Riesgo:</strong> {solicitud.nivel_riesgo || 'No disponible'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom color="primary">
                                Información de la Solicitud
                            </Typography>
                            <Typography variant="body2">
                                <strong>Número:</strong> {solicitud.numero_solicitud || 'No disponible'}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Fecha creación:</strong> {solicitud.created_at ? new Date(solicitud.created_at).toLocaleDateString() : 'No disponible'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}