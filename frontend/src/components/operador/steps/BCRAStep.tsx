import React from 'react';
import { Box, Typography, Alert, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';

interface BCRAStepProps {
    infoBCRA: any;
}

export default function BCRAStep({ infoBCRA }: BCRAStepProps) {
    if (!infoBCRA) {
        return (
            <Alert severity="info">
                No hay información disponible de BCRA para esta solicitud.
            </Alert>
        );
    }

    if (infoBCRA.error) {
        return (
            <Alert severity="warning">
                Error consultando BCRA: {infoBCRA.mensaje}
            </Alert>
        );
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Información BCRA - {infoBCRA.denominacion}
            </Typography>
            
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2">Total Deudas</Typography>
                            <Typography variant="h4">{infoBCRA.totalDeudas}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2">Monto Total</Typography>
                            <Typography variant="h4">
                                ${(infoBCRA.montoTotal * 1000).toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2">Situación Promedio</Typography>
                            <Typography variant="h4">{infoBCRA.situacionPromedio}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Entidades Reportadas
            </Typography>

            {infoBCRA.entidades.map((ent: any, index: number) => (
                <Card key={index} sx={{ mb: 1 }}>
                    <CardContent>
                        <Typography variant="subtitle2">{ent.nombre}</Typography>
                        <Typography variant="body2">
                            Situación: {ent.situacionDesc} | 
                            Monto: ${(ent.monto * 1000).toLocaleString()} | 
                            Días atraso: {ent.diasAtraso || 'No aplica'}
                        </Typography>
                    </CardContent>
                </Card>
            ))}
        </Box>
    );
}