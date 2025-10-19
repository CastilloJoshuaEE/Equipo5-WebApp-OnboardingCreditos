// frontend/src/components/operador/steps/DecisionStep.tsx
import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { CheckCircle, Cancel, Info } from '@mui/icons-material';

interface DecisionStepProps {
    solicitud: any;
    onClose: () => void;
}

export default function DecisionStep({ solicitud, onClose }: DecisionStepProps) {
    const handleAprobar = () => {
        // Lógica para aprobar solicitud
        console.log('Aprobando solicitud:', solicitud.id);
        // Aquí iría la llamada a la API
        alert('Funcionalidad de aprobación en desarrollo');
    };

    const handleRechazar = () => {
        // Lógica para rechazar solicitud
        console.log('Rechazando solicitud:', solicitud.id);
        // Aquí iría la llamada a la API
        alert('Funcionalidad de rechazo en desarrollo');
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Decisión Final
            </Typography>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="body1" gutterBottom>
                        Después de revisar toda la documentación e información, tome una decisión final sobre esta solicitud.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Solicitud: <strong>{solicitud.numero_solicitud}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Empresa: <strong>{solicitud.solicitantes?.nombre_empresa}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Monto: <strong>${solicitud.monto?.toLocaleString()}</strong>
                    </Typography>
                </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button 
                    variant="contained" 
                    color="success"
                    size="large"
                    startIcon={<CheckCircle />}
                    onClick={handleAprobar}
                    sx={{ minWidth: 200 }}
                >
                    Aprobar Solicitud
                </Button>
                <Button 
                    variant="contained" 
                    color="error"
                    size="large"
                    startIcon={<Cancel />}
                    onClick={handleRechazar}
                    sx={{ minWidth: 200 }}
                >
                    Rechazar Solicitud
                </Button>
                <Button 
                    variant="outlined"
                    size="large"
                    startIcon={<Info />}
                    onClick={onClose}
                >
                    Volver a Revisión
                </Button>
            </Box>
        </Box>
    );
}