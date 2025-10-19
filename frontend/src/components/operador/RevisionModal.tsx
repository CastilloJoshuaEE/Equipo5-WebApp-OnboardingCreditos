// frontend/src/components/operador/RevisionModal.tsx
'use client';

import React, { useState } from 'react';
import {
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stepper,
    Step,
    StepLabel,
    Alert,
    CircularProgress,
    Typography
} from '@mui/material';
import { RevisionData } from '@/types/operador';
import ResumenStep from './steps/ResumenStep';
import DocumentacionStep from './steps/DocumentacionStep';
import BCRAStep from './steps/BCRAStep';
import ScoringStep from './steps/ScoringStep';
import DecisionStep from './steps/DecisionStep';

interface RevisionModalProps {
    open: boolean;
    onClose: () => void;
    data: RevisionData;
}

export default function RevisionModal({ open, onClose, data }: RevisionModalProps) {
    const [pasoActivo, setPasoActivo] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const pasos = [
        'Resumen',
        'Documentación',
        'Información BCRA', 
        'Scoring',
        'Decisión'
    ];

    const handleSiguiente = () => {
        setPasoActivo((prev) => Math.min(prev + 1, pasos.length - 1));
    };

    const handleAnterior = () => {
        setPasoActivo((prev) => Math.max(prev - 1, 0));
    };

    const handleValidarDocumento = async (documentoId: string, estado: string, comentarios?: string) => {
        try {
            setLoading(true);
            setError('');
            
            // Aquí iría la llamada a la API para validar documento
            console.log('Validando documento:', documentoId, estado, comentarios);
            
            // Simulación de llamada API
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error: any) {
            setError(error.message || 'Error al validar documento');
        } finally {
            setLoading(false);
        }
    };

    const handleDescargarDocumento = async (documento: any) => {
        try {
            setLoading(true);
            
            // Usar URL directa de Supabase Storage
            const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseUrl = `${baseUrl}/storage/v1/object/public/kyc-documents/${documento.ruta_storage}`;            
            // Crear enlace temporal para descarga
            const link = document.createElement('a');
            link.href = supabaseUrl;
            link.download = documento.nombre_archivo;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error('Error descargando documento:', error);
            setError('Error al descargar el documento');
        } finally {
            setLoading(false);
        }
    };

    const handleVerDocumento = (documento: any) => {
        // Abrir documento en nueva pestaña
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseUrl = `${baseUrl}/storage/v1/object/public/kyc-documents/${documento.ruta_storage}`;
        window.open(supabaseUrl, '_blank');
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            scroll="paper"
            sx={{
                '& .MuiDialog-paper': {
                    minHeight: '80vh',
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h5" component="div" fontWeight="bold">
                            Revisión de Solicitud
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            {data.solicitud.numero_solicitud} - {data.solicitud.solicitantes?.nombre_empresa}
                        </Typography>
                    </Box>
                    {loading && <CircularProgress size={24} />}
                </Box>
            </DialogTitle>
            
            <DialogContent dividers sx={{ py: 2 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ mt: 1 }}>
                    <Stepper activeStep={pasoActivo} sx={{ mb: 4 }}>
                        {pasos.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {pasoActivo === 0 && (
                        <ResumenStep 
                            solicitud={data.solicitud} 
                        />
                    )}
                    
                    {pasoActivo === 1 && (
                        <DocumentacionStep 
                            documentos={data.documentos} 
                            scoring={data.scoring}
                            onValidarDocumento={handleValidarDocumento}
                            onDescargarDocumento={handleDescargarDocumento}
                            onVerDocumento={handleVerDocumento}
                            loading={loading}
                        />
                    )}
                    
                    {pasoActivo === 2 && (
                        <BCRAStep 
                            infoBCRA={data.infoBCRA} 
                        />
                    )}
                    
                    {pasoActivo === 3 && (
                        <ScoringStep 
                            scoring={data.scoring}
                        />
                    )}
                    
                    {pasoActivo === 4 && (
                        <DecisionStep 
                            solicitud={data.solicitud}
                            onClose={onClose}
                        />
                    )}
                </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, gap: 1, borderTop: 1, borderColor: 'divider' }}>
                <Button onClick={onClose} variant="outlined">
                    Cerrar
                </Button>
                
                <Box sx={{ flex: 1 }} />
                
                <Button 
                    disabled={pasoActivo === 0 || loading}
                    onClick={handleAnterior}
                    variant="outlined"
                >
                    Anterior
                </Button>
                
                <Button 
                    variant="contained"
                    onClick={handleSiguiente}
                    disabled={pasoActivo === pasos.length - 1 || loading}
                >
                    {pasoActivo === pasos.length - 2 ? 'Finalizar Revisión' : 'Siguiente'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}