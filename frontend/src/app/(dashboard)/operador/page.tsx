// frontend/src/app/(dashboard)/operador/page.tsx
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
    Grid,
    LinearProgress
} from '@mui/material';
import { Documento, RevisionData, SolicitudOperador } from '@/types/operador';
import RevisionModal from '@/components/operador/RevisionModal';

export default function OperadorDashboard() {
    const [solicitudes, setSolicitudes] = useState<SolicitudOperador[]>([]);
    const [loading, setLoading] = useState(true);
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

    const getNombreContacto = (solicitud: SolicitudOperador) => {
        const usuario = Array.isArray(solicitud.solicitantes.usuarios) 
            ? solicitud.solicitantes.usuarios[0] 
            : solicitud.solicitantes.usuarios;
        return usuario?.nombre_completo || 'Sin contacto';
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

            {/* Modal de Revisión usando el componente importado */}
            {solicitudSeleccionada && (
                <RevisionModal 
                    open={modalRevision}
                    onClose={() => setModalRevision(false)}
                    data={solicitudSeleccionada}
                />
            )}
        </Box>
    );
}