import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { SolicitudOperador } from '@/types/operador';
import Grid from '@mui/material/Unstable_Grid2';

interface ResumenStepProps {
    solicitud: SolicitudOperador;
}

export default function ResumenStep({ solicitud }: ResumenStepProps) {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Resumen de la Solicitud
            </Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom color="primary">
                                Información de la Empresa
                            </Typography>
                            <Typography><strong>Nombre:</strong> {solicitud.solicitantes.nombre_empresa}</Typography>
                            <Typography><strong>CUIT:</strong> {solicitud.solicitantes.cuit}</Typography>
                            <Typography><strong>Representante Legal:</strong> {solicitud.solicitantes.representante_legal}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom color="primary">
                                Información de Contacto
                            </Typography>
                            <Typography><strong>Contacto:</strong> {solicitud.solicitantes.usuarios.nombre_completo}</Typography>
                            <Typography><strong>Email:</strong> {solicitud.solicitantes.usuarios.email}</Typography>
                            <Typography><strong>Teléfono:</strong> {solicitud.solicitantes.usuarios.telefono}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom color="primary">
                                Detalles del Crédito
                            </Typography>
                            <Typography><strong>Monto:</strong> ${solicitud.monto.toLocaleString()}</Typography>
                            <Typography><strong>Plazo:</strong> {solicitud.plazo_meses} meses</Typography>
                            <Typography><strong>Estado:</strong> {solicitud.estado}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}