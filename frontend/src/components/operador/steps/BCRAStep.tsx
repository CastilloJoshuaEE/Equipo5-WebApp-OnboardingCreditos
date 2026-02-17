// frontend/src/components/operador/steps/BCRAStep.tsx
import React from 'react';
import { Box, Typography, Alert, Card, CardContent, Chip } from '@mui/material';
import Grid from '@mui/material/Grid';
import { BCRAStepProps } from '@/features/riesgo/bcra.types';
export default function BCRAStep({ infoBCRA }: BCRAStepProps) {
    if (!infoBCRA) {
        return (
            <Alert severity="info">
                No hay información disponible de BCRA para esta solicitud.
            </Alert>
        );
    }

    if (infoBCRA.error || !infoBCRA.success) {
        return (
            <Alert severity="warning">
                {infoBCRA.mensaje || infoBCRA.error || 'Error consultando BCRA'}
                {infoBCRA.sinSSL && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Nota:</strong> Se utilizó conexión sin verificación SSL para desarrollo.
                    </Typography>
                )}
            </Alert>
        );
    }

    const datosProcesados = infoBCRA.procesado || infoBCRA.data;

    if (!datosProcesados || !datosProcesados.encontrado) {
        return (
            <Alert severity="info">
                {datosProcesados?.mensaje || 'No se encontraron registros en BCRA para este CUIT'}
            </Alert>
        );
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Información BCRA - {datosProcesados.denominacion || 'Empresa'}
            </Typography>
            
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2">Total Deudas Reportadas</Typography>
                            <Typography variant="h4">{datosProcesados.totalDeudas || 0}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2">Monto Total (en miles $)</Typography>
                            <Typography variant="h4">
                                ${(datosProcesados.montoTotal || 0).toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2">Situación Promedio</Typography>
                            <Typography variant="h4">
                                {datosProcesados.situacionPromedio || 'No disponible'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Entidades Reportadas ({datosProcesados.entidades?.length || 0})
            </Typography>

            {datosProcesados.entidades && datosProcesados.entidades.length > 0 ? (
                datosProcesados.entidades.map((ent: any, index: number) => (
                    <Card key={index} sx={{ mb: 1 }}>
                        <CardContent>
                            <Typography variant="subtitle2">{ent.nombre}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Situación:</strong> {ent.situacionDesc} | 
                                <strong> Monto:</strong> ${(ent.monto || 0).toLocaleString()}k | 
                                <strong> Días atraso:</strong> {ent.diasAtraso || 'No aplica'}
                            </Typography>
                            {ent.refinanciaciones && (
                                <Chip label="Refinanciaciones" size="small" color="warning" sx={{ mt: 0.5, mr: 0.5 }} />
                            )}
                            {ent.situacionJuridica && (
                                <Chip label="Situación Jurídica" size="small" color="error" sx={{ mt: 0.5 }} />
                            )}
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Alert severity="info">
                    No hay entidades reportadas para esta empresa.
                </Alert>
            )}

            <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    <strong>Período consultado:</strong> {datosProcesados.periodo || 'No disponible'} | 
                    <strong> Última actualización:</strong> {new Date(infoBCRA.consulta || Date.now()).toLocaleString()}
                </Typography>
            </Box>
        </Box>
    );
}