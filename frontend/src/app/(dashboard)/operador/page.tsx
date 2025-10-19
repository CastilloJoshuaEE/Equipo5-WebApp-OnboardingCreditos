'use client';
import { signOut } from 'next-auth/react';
import React, { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Chip,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stepper,
    Step,
    StepLabel,
    LinearProgress
} from '@mui/material';
// Cambiar esta importación
import Grid from '@mui/material/Grid';
import { Documento } from '@/services/documentos.service';

interface SolicitudOperador {
    id: string;
    numero_solicitud: string;
    monto: number;
    plazo_meses: number;
    estado: string;
    nivel_riesgo: string;
    created_at: string;
    solicitantes: {
        nombre_empresa: string;
        cuit: string;
        representante_legal: string;
        usuarios: {
            nombre_completo: string;
            email: string;
            telefono: string;
        };
    };
}

// Agregar interfaz para datos de revisión
interface RevisionData {
    solicitud: any;
    documentos: Documento[];
    infoBCRA: any;
    scoring: any;
    solicitante: any;
}

export default function OperadorDashboard() {
    const [solicitudes, setSolicitudes] = useState<SolicitudOperador[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    
    const getNombreContacto = (solicitud: SolicitudOperador) => {
        const usuario = Array.isArray(solicitud.solicitantes.usuarios) 
            ? solicitud.solicitantes.usuarios[0] 
            : solicitud.solicitantes.usuarios;
        return usuario?.nombre_completo || 'Sin contacto';
    };

    const [filtros, setFiltros] = useState({
        estado: '',
        nivel_riesgo: '',
        fecha_desde: '',
        fecha_hasta: '',
        numero_solicitud: '',
        dni: ''
    });
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<RevisionData | null>(null);
    const [modalRevision, setModalRevision] = useState(false);

    // FUNCIÓN CORREGIDA: Descargar documento específico
    const handleDescargarDocumento = async (documento: Documento) => {
        try {
            const session = await getSession();
            
            if (!session?.accessToken) {
                throw new Error('No estás autenticado');
            }

            console.log('📥 Descargando documento:', documento.nombre_archivo);

            // Primero intentar con el endpoint de descarga
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${API_URL}/documentos/${documento.id}/descargar`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = documento.nombre_archivo;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                console.log('✅ Documento descargado exitosamente');
            } else {
                // Fallback: usar URL directa de Supabase
                console.log('⚠️ Usando fallback de Supabase Storage');
                const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                const supabaseUrl = `${baseUrl}/storage/v1/object/public/kyc-documents/${documento.ruta_storage}`;
                window.open(supabaseUrl, '_blank');
            }
        } catch (error) {
            console.error('❌ Error descargando documento:', error);
            // Fallback final
            const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseUrl = `${baseUrl}/storage/v1/object/public/kyc-documents/${documento.ruta_storage}`;
            window.open(supabaseUrl, '_blank');
        }
    };

    // FUNCIÓN CORREGIDA: Ver documento específico
    const handleVerDocumento = (documento: Documento) => {
        console.log('👀 Abriendo documento:', documento.nombre_archivo);
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseUrl = `${baseUrl}/storage/v1/object/public/kyc-documents/${documento.ruta_storage}`;
        window.open(supabaseUrl, '_blank');
    };

    useEffect(() => {
        cargarDashboard();
    }, []);

    const handleLogout = async () => {
        try {
            const currentSession = await getSession();
            
            if (currentSession?.user?.id) {
                const userId = currentSession.user.id;
                localStorage.removeItem(`solicitud_borrador_${userId}`);
                
                // Limpiar todos los borradores
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.includes(`solicitud_borrador_`)) {
                        keysToRemove.push(key);
                    }
                }
                
                keysToRemove.forEach(key => {
                    localStorage.removeItem(key);
                });
            }

            await signOut({ 
                callbackUrl: '/login',
                redirect: true 
            });

        } catch (error) {
            console.error('Error durante el logout:', error);
            await signOut({ callbackUrl: '/login' });
        }
    };

    const cargarDashboard = async () => {
        try {
            const session = await getSession();
            if (!session?.accessToken) {
                console.error('. No hay token de acceso');
                return;
            }

            const params = new URLSearchParams();
            Object.entries(filtros).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            console.log(`. Solicitando dashboard: ${API_URL}/operador/dashboard?${params}`);

            const response = await fetch(`${API_URL}/operador/dashboard?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`📨 Respuesta del servidor: ${response.status}`);

            if (response.ok) {
                const data = await response.json();
                console.log('. Dashboard cargado:', data);
                setSolicitudes(data.data.solicitudes || []);
            } else {
                const errorText = await response.text();
                console.error('. Error cargando dashboard:', response.status, errorText);
            }
        } catch (error) {
            console.error('. Error cargando dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleIniciarRevision = async (solicitudId: string) => {
        try {
            const session = await getSession();
            if (!session?.accessToken) return;

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            
            const response = await fetch(`${API_URL}/operador/solicitudes/${solicitudId}/revision`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSolicitudSeleccionada(data.data);
                setModalRevision(true);
            } else {
                console.error('Error en respuesta:', response.status);
            }
        } catch (error) {
            console.error('Error iniciando revisión:', error);
        }
    };

    const getEstadoColor = (estado: string) => {
        const colores: any = {
            'en_revision': 'warning',
            'pendiente_info': 'info',
            'aprobado': 'success',
            'rechazado': 'error'
        };
        return colores[estado] || 'default';
    };

    const getRiesgoColor = (riesgo: string) => {
        const colores: any = {
            'bajo': 'success',
            'medio': 'warning',
            'alto': 'error'
        };
        return colores[riesgo] || 'default';
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Dashboard Operador
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                        variant="outlined" 
                        color="error"
                        onClick={handleLogout}
                    >
                        Cerrar Sesión
                    </Button>
                </Box>
            </Typography>

            {/* Filtros */}
            <Card sx={{ mb: 3, p: 2 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>Estado</InputLabel>
                            <Select
                                value={filtros.estado}
                                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                                label="Estado"
                            >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="en_revision">En Revisión</MenuItem>
                                <MenuItem value="pendiente_info">Pendiente Info</MenuItem>
                                <MenuItem value="aprobado">Aprobado</MenuItem>
                                <MenuItem value="rechazado">Rechazado</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>Nivel Riesgo</InputLabel>
                            <Select
                                value={filtros.nivel_riesgo}
                                onChange={(e) => setFiltros({...filtros, nivel_riesgo: e.target.value})}
                                label="Nivel Riesgo"
                            >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="bajo">Bajo</MenuItem>
                                <MenuItem value="medio">Medio</MenuItem>
                                <MenuItem value="alto">Alto</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>  
                        <TextField
                            label="Desde"
                            type="date"
                            fullWidth
                            value={filtros.fecha_desde}
                            onChange={(e) => setFiltros({...filtros, fecha_desde: e.target.value})}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}> 
                        <TextField
                            label="Hasta"
                            type="date"
                            fullWidth
                            value={filtros.fecha_hasta}
                            onChange={(e) => setFiltros({...filtros, fecha_hasta: e.target.value})}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                            label="Número Solicitud"
                            fullWidth
                            value={filtros.numero_solicitud}
                            onChange={(e) => setFiltros({...filtros, numero_solicitud: e.target.value})}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                            label="DNI Solicitante"
                            fullWidth
                            value={filtros.dni}
                            onChange={(e) => setFiltros({...filtros, dni: e.target.value})}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={cargarDashboard}
                        >
                            Buscar
                        </Button>
                    </Grid>
                </Grid>
            </Card>

            {/* Lista de Solicitudes */}
            {loading ? (
                <LinearProgress />
            ) : (
                <Grid container spacing={2}>
                    {solicitudes.map((solicitud) => (
                        <Grid size={{ xs: 12 }} key={solicitud.id}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box>
                                            <Typography variant="h6">
                                                {solicitud.numero_solicitud}
                                            </Typography>
                                            <Typography variant="subtitle1" color="primary">
                                                {solicitud.solicitantes?.nombre_empresa || 'Empresa no encontrada'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                CUIT: {solicitud.solicitantes?.cuit || '-'} | 
                                                Contacto: {getNombreContacto(solicitud)}                                            
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Chip 
                                                label={solicitud.estado} 
                                                color={getEstadoColor(solicitud.estado)}
                                            />
                                            <Chip 
                                                label={`Riesgo: ${solicitud.nivel_riesgo}`}
                                                color={getRiesgoColor(solicitud.nivel_riesgo)}
                                                variant="outlined"
                                            />
                                        </Box>
                                    </Box>

                                    <Grid container spacing={2} alignItems="center">
                                        <Grid size={{ xs: 12, md: 3 }}>  
                                            <Typography variant="subtitle2">Monto</Typography>
                                            <Typography>${solicitud.monto.toLocaleString()}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 3 }}>  
                                            <Typography variant="subtitle2">Plazo</Typography>
                                            <Typography>{solicitud.plazo_meses} meses</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 3 }}>  
                                            <Typography variant="subtitle2">Fecha</Typography>
                                            <Typography>
                                                {new Date(solicitud.created_at).toLocaleDateString()}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 3 }}>  
                                            <Button 
                                                variant="contained"
                                                onClick={() => handleIniciarRevision(solicitud.id)}
                                            >
                                                Revisar
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Modal de Revisión */}
            <Dialog 
                open={modalRevision} 
                onClose={() => setModalRevision(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    Revisión de Solicitud: {solicitudSeleccionada?.solicitud?.numero_solicitud}
                </DialogTitle>
                <DialogContent>
                    {solicitudSeleccionada && (
                        <RevisionModalContent 
                            data={solicitudSeleccionada}
                            onClose={() => setModalRevision(false)}
                            onDescargarDocumento={handleDescargarDocumento}
                            onVerDocumento={handleVerDocumento}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}


// Componente interno para el modal de revisión
function RevisionModalContent({ data, onClose, onDescargarDocumento, onVerDocumento }: any) {
    const [pasoActivo, setPasoActivo] = useState(0);

    const pasos = [
        'Documentación',
        'Información BCRA', 
        'Scoring',
        'Decisión'
    ];

    return (
        <Box sx={{ mt: 2 }}>
            <Stepper activeStep={pasoActivo} sx={{ mb: 4 }}>
                {pasos.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {pasoActivo === 0 && (
                <DocumentacionStep 
                    documentos={data.documentos} 
                    scoring={data.scoring}
                    onDescargarDocumento={onDescargarDocumento}
                    onVerDocumento={onVerDocumento}
                />
            )}

            {pasoActivo === 1 && (
                <BCRAStep infoBCRA={data.infoBCRA} />
            )}

            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button 
                    disabled={pasoActivo === 0}
                    onClick={() => setPasoActivo(pasoActivo - 1)}
                >
                    Anterior
                </Button>
                <Button 
                    variant="contained"
                    disabled={pasoActivo === pasos.length - 1}
                    onClick={() => setPasoActivo(pasoActivo + 1)}
                >
                    Siguiente
                </Button>
            </DialogActions>
        </Box>
    );
}
// Componente DocumentacionStep - CORREGIDO
function DocumentacionStep({ documentos, scoring, onDescargarDocumento, onVerDocumento }: any) {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Documentación ({scoring?.total}% completado)
            </Typography>
            
            <LinearProgress 
                variant="determinate" 
                value={scoring?.total || 0} 
                sx={{ mb: 3, height: 10, borderRadius: 5 }}
            />

            <Grid container spacing={2}>
                {documentos && documentos.map((documento: Documento) => (
                    <Grid size={{ xs: 12, md: 6 }} key={documento.id}>
                        <Card variant="outlined">
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                                        {documento.tipo.replace('_', ' ')}
                                    </Typography>
                                    <Chip 
                                        label={documento.estado}
                                        color={
                                            documento.estado === 'validado' ? 'success' : 
                                            documento.estado === 'rechazado' ? 'error' : 'warning'
                                        }
                                        size="small"
                                    />
                                </Box>
                                
                                <Typography variant="body2" color="text.secondary" noWrap>
                                    {documento.nombre_archivo}
                                </Typography>
                                
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Subido: {new Date(documento.created_at).toLocaleDateString()}
                                </Typography>

                                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                    <Button 
                                        onClick={() => onDescargarDocumento(documento)} 
                                        variant="outlined" 
                                        size="small"
                                    >
                                        Descargar
                                    </Button>
                                    <Button 
                                        onClick={() => onVerDocumento(documento)} 
                                        variant="outlined" 
                                        size="small"
                                    >
                                        Ver
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Mostrar también el scoring si está disponible */}
            {scoring?.desglose && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Puntuación por Documentos
                    </Typography>
                    <Grid container spacing={1}>
                        {Object.entries(scoring.desglose).map(([tipo, info]: [string, any]) => (
                            <Grid size={{ xs: 12, md: 6 }} key={tipo}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                        {tipo.replace('_', ' ')}
                                    </Typography>
                                    <Chip 
                                        label={`${info.puntaje}%`}
                                        color={info.puntaje === 20 ? 'success' : 'error'}
                                        size="small"
                                    />
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </Box>
    );
}
function BCRAStep({ infoBCRA }: any) {
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
                Información BCRA - {datosProcesados.denominacion}
            </Typography>
            
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>  
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2">Total Deudas Reportadas</Typography>
                            <Typography variant="h4">{datosProcesados.totalDeudas}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>  
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2">Monto Total (en miles $)</Typography>
                            <Typography variant="h4">
                                ${datosProcesados.montoTotal.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>  
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2">Situación Promedio</Typography>
                            <Typography variant="h4">
                                {datosProcesados.situacionPromedio} - {datosProcesados.entidades[0]?.situacionDesc.split(' - ')[0]}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Entidades Reportadas ({datosProcesados.entidades.length})
            </Typography>

            {datosProcesados.entidades.map((ent: any, index: number) => (
                <Card key={index} sx={{ mb: 1 }}>
                    <CardContent>
                        <Typography variant="subtitle2">{ent.nombre}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Situación:</strong> {ent.situacionDesc} | 
                            <strong> Monto:</strong> ${ent.monto.toLocaleString()}k | 
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
            ))}

            <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    <strong>Período consultado:</strong> {datosProcesados.periodo} | 
                    <strong> Última actualización:</strong> {new Date(infoBCRA.consulta).toLocaleString()}
                </Typography>
            </Box>
        </Box>
    );
}