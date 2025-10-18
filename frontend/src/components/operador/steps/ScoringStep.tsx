import React from 'react';
import { Box, Typography, Card, CardContent, Chip, LinearProgress } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';

interface ScoringStepProps {
    scoring: any;
}

export default function ScoringStep({ scoring }: ScoringStepProps) {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Análisis de Scoring
            </Typography>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5">Puntaje Total</Typography>
                        <Chip 
                            label={`${scoring?.total || 0}%`}
                            color={
                                (scoring?.total || 0) >= 80 ? 'success' : 
                                (scoring?.total || 0) >= 60 ? 'warning' : 'error'
                            }
                        />
                    </Box>
                    <LinearProgress 
                        variant="determinate" 
                        value={scoring?.total || 0} 
                        sx={{ height: 15, borderRadius: 5 }}
                        color={
                            (scoring?.total || 0) >= 80 ? 'success' : 
                            (scoring?.total || 0) >= 60 ? 'warning' : 'error'
                        }
                    />
                </CardContent>
            </Card>

            <Typography variant="h6" sx={{ mb: 2 }}>
                Desglose por Categoría
            </Typography>

            <Grid container spacing={2}>
                {Object.entries(scoring?.desglose || {}).map(([tipo, info]: [string, any]) => (
                    <Grid item xs={12} md={6} key={tipo}>
                        <Card variant="outlined">
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                                        {tipo.replace(/_/g, ' ')}
                                    </Typography>
                                    <Chip 
                                        label={`${info.puntaje}%`}
                                        color={info.puntaje >= 80 ? 'success' : info.puntaje >= 60 ? 'warning' : 'error'}
                                        size="small"
                                    />
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    Estado: {info.estado}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}