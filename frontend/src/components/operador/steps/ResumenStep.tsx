// frontend/src/components/operador/steps/ResumenStep.tsx
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid';
import { SolicitudOperador } from '@/types/operador';

interface ResumenStepProps {
    solicitud: SolicitudOperador;
}

export default function ResumenStep({ solicitud }: ResumenStepProps) {
    // Función mejorada para acceder a los datos anidados
// Mejorar la función getContactoInfo
const getContactoInfo = (solicitud: SolicitudOperador) => {
    console.log('. Datos completos del solicitante:', solicitud.solicitantes);
    
    // Si viene de la nueva estructura del backend
    if (solicitud.solicitante_info) {
        return {
            nombre: solicitud.solicitante_info.contacto || 'No disponible',
            email: solicitud.solicitante_info.email || 'No disponible',
            telefono: solicitud.solicitante_info.telefono || 'No disponible'
        };
    }
    
    // Si viene de la estructura antigua
    if (!solicitud?.solicitantes?.usuarios) {
        console.warn('. No hay información de usuarios en solicitantes');
        return {
            nombre: 'No disponible',
            email: 'No disponible', 
            telefono: 'No disponible'
        };
    }
    
    const usuario = solicitud.solicitantes.usuarios;
    console.log('👤 Datos de usuario:', usuario);
    
    return {
        nombre: usuario?.nombre_completo || 'No disponible',
        email: usuario?.email || 'No disponible',
        telefono: usuario?.telefono || 'No disponible'
    };
};


    // Función para obtener datos de la empresa
    const getEmpresaInfo = () => {
        if (!solicitud?.solicitantes) {
            return {
                nombre_empresa: 'No disponible',
                cuit: 'No disponible',
                representante_legal: 'No disponible',
                domicilio: 'No disponible'
            };
        }

        return {
            nombre_empresa: solicitud.solicitantes.nombre_empresa || 'No disponible',
            cuit: solicitud.solicitantes.cuit || 'No disponible',
            representante_legal: solicitud.solicitantes.representante_legal || 'No disponible',
            domicilio: solicitud.solicitantes.domicilio || 'No disponible' // CORREGIDO: ahora la propiedad existe
        };
    };

const contacto = getContactoInfo(solicitud);
    const empresa = getEmpresaInfo();

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
                                <strong>Nombre:</strong> {empresa.nombre_empresa}
                            </Typography>
                            <Typography variant="body2">
                                <strong>CUIT:</strong> {empresa.cuit}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Representante Legal:</strong> {empresa.representante_legal}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Domicilio:</strong> {empresa.domicilio}
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
                                <strong>Propósito:</strong> {solicitud.proposito || 'No especificado'} {/* CORREGIDO: ahora la propiedad existe */}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom color="primary">
                                Estado y Riesgo
                            </Typography>
                            <Typography variant="body2">
                                <strong>Estado:</strong> {solicitud.estado || 'No disponible'}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Riesgo:</strong> {solicitud.nivel_riesgo || 'No disponible'}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Moneda:</strong> {solicitud.moneda || 'ARS'} {/* CORREGIDO: ahora la propiedad existe */}
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
                            {solicitud.fecha_envio && (
                                <Typography variant="body2">
                                    <strong>Fecha envío:</strong> {new Date(solicitud.fecha_envio).toLocaleDateString()}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}