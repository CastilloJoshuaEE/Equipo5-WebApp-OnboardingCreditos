'use client';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Divider,
  CircularProgress,
  Container
} from '@mui/material';
import { getSession } from 'next-auth/react';

import {
  Dashboard as DashboardIcon,
  CreditCard as CreditCardIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  ArrowBack as ArrowBackIcon,
  CloudDownload as CloudDownloadIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  CheckCircle,
  MarkEmailRead,
  FilterList,
  Clear
} from '@mui/icons-material';
import { Notificacion } from '@/services/notificaciones.service';
import notificacionesService from '@/services/notificaciones.service';
import Image from 'next/image';

interface NotificacionConDetalle extends Notificacion {
  solicitudId?: string;
}

export default function NotificacionesPage() {
  const router = useRouter();
  const [rolUsuario, setRolUsuario] = useState<string>('');

  const [notificaciones, setNotificaciones] = useState<NotificacionConDetalle[]>([]);
  const [notificacionSeleccionada, setNotificacionSeleccionada] = useState<NotificacionConDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(true);
  const [filtros, setFiltros] = useState({
    recientes: false,
    esteMes: false,
    noLeidas: false
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    recientes: false,
    esteMes: false,
    noLeidas: false
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    cargarNotificaciones();
  }, []);
useEffect(() => {
  const obtenerRolUsuario = async () => {
    try {

      const session = await getSession(); 
      if (session?.user?.rol) {
        setRolUsuario(session.user.rol);
      }
    } catch (error) {
      console.error('Error obteniendo rol del usuario:', error);
    }
  };

  obtenerRolUsuario();
}, []);
  const cargarNotificaciones = async (paginaActual: number = 1) => {
    try {
      setCargando(true);
      const limit = 10;
      const offset = (paginaActual - 1) * limit;
      
      const response = await notificacionesService.obtenerNotificaciones(limit, offset);
      const notificacionesConDetalle: NotificacionConDetalle[] = response.data.map(notif => ({
        ...notif,
        solicitudId: notif.datos_adicionales?.solicitud_numero || `SOL-${notif.solicitud_id?.slice(-3) || '000'}`
      }));
      
      if (paginaActual === 1) {
        setNotificaciones(notificacionesConDetalle);
        // Seleccionar automáticamente la primera notificación al cargar
        if (notificacionesConDetalle.length > 0) {
          setNotificacionSeleccionada(notificacionesConDetalle[0]);
        }
      } else {
        setNotificaciones(prev => [...prev, ...notificacionesConDetalle]);
      }
      
      setHayMas(response.data.length === limit);
      setPagina(paginaActual);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  const marcarComoLeida = async (id: string) => {
    try {
      await notificacionesService.marcarComoLeida(id);
      setNotificaciones(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, leida: true } : notif
        )
      );
      // Actualizar también la notificación seleccionada si es la misma
      if (notificacionSeleccionada?.id === id) {
        setNotificacionSeleccionada(prev => prev ? { ...prev, leida: true } : null);
      }
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      await notificacionesService.marcarTodasComoLeidas();
      setNotificaciones(prev => 
        prev.map(notif => ({ ...notif, leida: true }))
      );
      // Actualizar también la notificación seleccionada
      if (notificacionSeleccionada) {
        setNotificacionSeleccionada(prev => prev ? { ...prev, leida: true } : null);
      }
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  };

  const handleSeleccionarNotificacion = (notificacion: NotificacionConDetalle) => {
    setNotificacionSeleccionada(notificacion);
    // Marcar como leída al seleccionar
    if (!notificacion.leida) {
      marcarComoLeida(notificacion.id);
    }
  };

  const handleFiltroChange = (filtro: keyof typeof filtros) => {
    setFiltros(prev => ({
      ...prev,
      [filtro]: !prev[filtro]
    }));
  };

  const aplicarFiltros = () => {
    setFiltrosAplicados({ ...filtros });
  };

  const limpiarFiltros = () => {
    const filtrosLimpiados = {
      recientes: false,
      esteMes: false,
      noLeidas: false
    };
    setFiltros(filtrosLimpiados);
    setFiltrosAplicados(filtrosLimpiados);
  };

  const handleVolverDashboard = () => {
    router.push('/solicitante');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatearFechaCompleta = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerColorTipo = (tipo: string) => {
    const colores: { [key: string]: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" } = {
      cambio_estado: 'primary',
      nueva_solicitud: 'success',
      documento_validado: 'info',
      informacion_solicitada: 'warning',
      sistema: 'default',
    };
    return colores[tipo] || 'default';
  };

  const obtenerIconoTipo = (tipo: string) => {
    const iconos: { [key: string]: JSX.Element } = {
      cambio_estado: <Box component="span">🔄</Box>,
      nueva_solicitud: <Box component="span">📋</Box>,
      documento_validado: <Box component="span">.</Box>,
      informacion_solicitada: <Box component="span">❓</Box>,
      sistema: <Box component="span">ℹ️</Box>,
    };
    return iconos[tipo] || <Box component="span">📢</Box>;
  };

  const obtenerEstadoSolicitud = (tipo: string) => {
    const estados: { [key: string]: string } = {
      cambio_estado: 'En revisión',
      nueva_solicitud: 'Nueva',
      documento_validado: 'Documentos aprobados',
      informacion_solicitada: 'Información requerida',
      sistema: 'Sistema'
    };
    return estados[tipo] || 'En proceso';
  };

  const obtenerColorEstado = (tipo: string) => {
    const colores: { [key: string]: string } = {
      cambio_estado: 'var(--color-status-info)',
      nueva_solicitud: 'var(--color-status-success)',
      documento_validado: 'var(--color-status-success)',
      informacion_solicitada: 'var(--color-status-warning)',
      sistema: 'var(--color-text-light)'
    };
    return colores[tipo] || 'var(--color-status-info)';
  };

  // Filtrar notificaciones según los filtros aplicados
  const notificacionesFiltradas = notificaciones.filter(notif => {
    // Si no hay filtros aplicados, mostrar todas
    if (!filtrosAplicados.recientes && !filtrosAplicados.esteMes && !filtrosAplicados.noLeidas) {
      return true;
    }

    let cumpleFiltro = true;

    if (filtrosAplicados.recientes) {
      const fechaNotif = new Date(notif.created_at);
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 7); // Últimos 7 días
      cumpleFiltro = cumpleFiltro && fechaNotif >= fechaLimite;
    }

    if (filtrosAplicados.esteMes) {
      const fechaNotif = new Date(notif.created_at);
      const ahora = new Date();
      cumpleFiltro = cumpleFiltro && 
        fechaNotif.getMonth() === ahora.getMonth() && 
        fechaNotif.getFullYear() === ahora.getFullYear();
    }

    if (filtrosAplicados.noLeidas) {
      cumpleFiltro = cumpleFiltro && !notif.leida;
    }

    return cumpleFiltro;
  });

  // Verificar si hay filtros activos
  const hayFiltrosActivos = filtrosAplicados.recientes || filtrosAplicados.esteMes || filtrosAplicados.noLeidas;

  return (
    <Box className="dashboard-container">
     
      {/* Main Content */}
      <main className="main-content">
  

        <section className="page-content">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h1" className="page-title">Notificaciones</Typography>
            <Typography variant="subtitle1" className="page-subtitle">
              Mantente informado sobre el estado de tus solicitudes y actualizaciones
            </Typography>
          </Box>

          {/* Filtros y Acciones */}
          <Card className="content-box">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h2" className="section-title">Filtros</Typography>
                <Box className="filters-container">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filtros.recientes}
                        onChange={() => handleFiltroChange('recientes')}
                        color="primary"
                      />
                    }
                    label="Últimos 7 días"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filtros.esteMes}
                        onChange={() => handleFiltroChange('esteMes')}
                        color="primary"
                      />
                    }
                    label="Este mes"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={filtros.noLeidas}
                        onChange={() => handleFiltroChange('noLeidas')}
                        color="primary"
                      />
                    }
                    label="No leídas"
                  />
                </Box>
                
                {/* Botones de aplicar y limpiar filtros */}
                <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                  <Button 
                    variant="contained" 
                    onClick={aplicarFiltros}
                    startIcon={<FilterList />}
                    className="btn-primary"
                    size="small"
                  >
                    Aplicar Filtros
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={limpiarFiltros}
                    startIcon={<Clear />}
                    className="btn-secondary"
                    size="small"
                    disabled={!hayFiltrosActivos}
                  >
                    Limpiar Filtros
                  </Button>
                </Box>

                {/* Indicador de filtros activos */}
                {hayFiltrosActivos && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="primary" sx={{ fontStyle: 'italic' }}>
                      Filtros activos: 
                      {filtrosAplicados.recientes && " Últimos 7 días"}
                      {filtrosAplicados.esteMes && " Este mes"}
                      {filtrosAplicados.noLeidas && " No leídas"}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Button 
                variant="outlined" 
                onClick={marcarTodasComoLeidas}
                startIcon={<MarkEmailRead />}
                className="btn-secondary"
              >
                Marcar todas como leídas
              </Button>
            </Box>
            <Divider className="filter-divider" />
          </Card>

          {/* Estado vacío */}
          {cargando && notificacionesFiltradas.length === 0 ? (
            <Card className="content-box empty-state">
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            </Card>
          ) : notificacionesFiltradas.length === 0 ? (
            <Card className="content-box empty-state">
              <Box className="empty-state-content" sx={{ textAlign: 'center', py: 4 }}>
                <Image 
                  src="/ilustraciones/nohayNotificacion.png" 
                  alt="Sin notificaciones"
                  width={400}
                  height={400}
                  style={{ margin: '0 auto 24px' }}
                />
                <Typography variant="h3" className="empty-state-title" gutterBottom>
                  {hayFiltrosActivos ? "No hay notificaciones que coincidan con los filtros" : "Sin notificaciones recientes"}
                </Typography>
                <Typography variant="body1" className="empty-state-text">
                  {hayFiltrosActivos 
                    ? "Intenta con otros filtros o limpia los filtros actuales para ver todas las notificaciones."
                    : "Cuando haya novedades sobre tus solicitudes, te lo haremos saber."
                  }
                </Typography>
              </Box>
            </Card>
          ) : (
            /* Lista de notificaciones */
            <Card className="content-box">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h2" className="section-title">Historial de Notificaciones</Typography>
                {hayFiltrosActivos && (
                  <Chip 
                    label={`${notificacionesFiltradas.length} resultado(s)`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
              <Typography variant="body1" className="section-subtitle">
                {notificacionesFiltradas.length} notificaciones encontradas
                {hayFiltrosActivos && " con los filtros aplicados"}
              </Typography>

              <Grid container spacing={3} className="notifications-grid">
                <Grid size={{ xs: 12, md: 8}}>
                  {/* Lista de notificaciones */}
                  <Box className="notifications-list">
                    {notificacionesFiltradas.map((notificacion) => (
                      <Card 
                        key={notificacion.id} 
                        className={`notification-card ${notificacionSeleccionada?.id === notificacion.id ? 'selected' : ''} ${!notificacion.leida ? 'no-leida' : ''}`}
                        onClick={() => handleSeleccionarNotificacion(notificacion)}
                        sx={{
                          backgroundColor: notificacion.leida ? 'background.paper' : 'primary.50',
                          borderColor: notificacionSeleccionada?.id === notificacion.id ? 
                            'primary.main' : (notificacion.leida ? 'divider' : 'primary.main'),
                          borderWidth: notificacionSeleccionada?.id === notificacion.id ? 2 : 1,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: '0 2px 8px rgba(160, 32, 240, 0.2)'
                          },
                          // Estilo diferenciado para no leídas
                          ...(!notificacion.leida && {
                            backgroundColor: 'rgba(160, 32, 240, 0.08)',
                            borderLeft: '4px solid',
                            borderLeftColor: 'primary.main'
                          })
                        }}
                      >
                        <CardContent>
                          <Box className="notification-header">
                            <Box className="notification-info">
                              <Typography variant="h6" className="notification-id">
                                {notificacion.solicitudId || 'Sistema'}
                              </Typography>
                              <Chip 
                                label={obtenerEstadoSolicitud(notificacion.tipo)}
                                className="status-badge"
                                size="small"
                                sx={{ 
                                  backgroundColor: obtenerColorEstado(notificacion.tipo),
                                  color: 'white'
                                }}
                              />
                              {!notificacion.leida && (
                                <Chip
                                  label="Nuevo"
                                  color="primary"
                                  size="small"
                                  sx={{ fontWeight: 'bold' }}
                                />
                              )}
                            </Box>
                            <Box>
                              {!notificacion.leida && (
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevenir que se active el click del card
                                    marcarComoLeida(notificacion.id);
                                  }}
                                  color="primary"
                                >
                                  <CheckCircle />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                          
                          <Typography variant="body2" className="notification-date">
                            {formatearFechaCompleta(notificacion.created_at)}
                          </Typography>
                          
                          <Box className="notification-body">
                            <Typography variant="h6" className="notification-text" sx={{ 
                              fontWeight: notificacion.leida ? 'normal' : 'bold',
                              color: notificacion.leida ? 'text.primary' : 'primary.main'
                            }}>
                              {notificacion.titulo}
                            </Typography>
                            <Typography variant="body2" className="notification-detail" sx={{
                              fontWeight: notificacion.leida ? 'normal' : '500'
                            }}>
                              {notificacion.mensaje}
                            </Typography>
                            
                            {notificacion.datos_adicionales && (
                              <Box className="additional-data">
                                {notificacion.datos_adicionales.monto && (
                                  <Typography variant="body2" className="notification-detail">
                                    <strong>Monto:</strong> ${notificacion.datos_adicionales.monto.toLocaleString()}
                                  </Typography>
                                )}
                                {notificacion.datos_adicionales.estado_anterior && (
                                  <Typography variant="body2" className="notification-detail">
                                    <strong>Cambio de estado:</strong> {notificacion.datos_adicionales.estado_anterior} → {notificacion.datos_adicionales.estado_nuevo}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>

                          <Box className="notification-actions">
{notificacion.solicitud_id && (
  <Button 
    variant="outlined" 
    size="small"
    onClick={(e) => {
      e.stopPropagation();
      
      // Lógica condicional basada en el rol
      if (rolUsuario === 'solicitante') {
        // Si es solicitante, va a la página de detalles de solicitud
        window.location.href = `/solicitante/solicitudes/${notificacion.solicitud_id}`;
      } else if (rolUsuario === 'operador') {
        // Si es operador, va al dashboard donde puede ver todas las solicitudes
        window.location.href = `/operador`;
      } else {
        // Rol por defecto o desconocido
        window.location.href = `/solicitante/solicitudes/${notificacion.solicitud_id}`;
      }
    }}
  >
    {rolUsuario === 'operador' ? 'Ir al dashboard' : 'Ver detalles solicitud'}
  </Button>
)}
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {hayMas && (
                      <Box display="flex" justifyContent="center" pt={2}>
                        <Button
                          onClick={() => cargarNotificaciones(pagina + 1)}
                          disabled={cargando}
                          variant="outlined"
                          className="btn-secondary"
                        >
                          {cargando ? 'Cargando...' : 'Cargar más'}
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4}}>
                  {/* Detalle de notificación */}
                  <Card className="notification-detail-card">
                    <CardContent>
                      <Box className="detail-header">
                      </Box>

                      <Typography variant="h3" className="detail-title">
                        {notificacionSeleccionada ? 
                          `Detalles de ${notificacionSeleccionada.solicitudId || 'notificación'}` : 
                          'Selecciona una notificación'
                        }
                      </Typography>

                      <Typography variant="h4" className="detail-subtitle">
                        Resumen
                      </Typography>
                      <Divider />

                      {notificacionSeleccionada ? (
                        <Box className="timeline-item">
                          <Box className="timeline-content" sx={{
                            backgroundColor: !notificacionSeleccionada.leida ? 'primary.50' : 'var(--color-purple-light)',
                            borderLeft: !notificacionSeleccionada.leida ? '4px solid' : 'none',
                            borderLeftColor: !notificacionSeleccionada.leida ? 'primary.main' : 'transparent'
                          }}>
                            <Box className="timeline-header">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                {obtenerIconoTipo(notificacionSeleccionada.tipo)}
                                <Typography variant="h5" className="timeline-title" sx={{
                                  fontWeight: !notificacionSeleccionada.leida ? 'bold' : 'normal'
                                }}>
                                  {notificacionSeleccionada.titulo}
                                </Typography>
                              </Box>
                            </Box>
                            <Typography variant="body2" className="timeline-date">
                              {formatearFechaCompleta(notificacionSeleccionada.created_at)}
                            </Typography>
                            <Typography variant="body1" className="timeline-description" sx={{
                              fontWeight: !notificacionSeleccionada.leida ? '500' : 'normal'
                            }}>
                              {notificacionSeleccionada.mensaje}
                            </Typography>
                            
                            {notificacionSeleccionada.datos_adicionales && (
                              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                {notificacionSeleccionada.datos_adicionales.solicitud_numero && (
                                  <Typography variant="body2">
                                    <strong>Solicitud:</strong> {notificacionSeleccionada.datos_adicionales.solicitud_numero}
                                  </Typography>
                                )}
                                {notificacionSeleccionada.datos_adicionales.monto && (
                                  <Typography variant="body2">
                                    <strong>Monto:</strong> ${notificacionSeleccionada.datos_adicionales.monto.toLocaleString()}
                                  </Typography>
                                )}
                                {notificacionSeleccionada.datos_adicionales.estado_anterior && (
                                  <Typography variant="body2">
                                    <strong>Estado anterior:</strong> {notificacionSeleccionada.datos_adicionales.estado_anterior}
                                  </Typography>
                                )}
                                {notificacionSeleccionada.datos_adicionales.estado_nuevo && (
                                  <Typography variant="body2">
                                    <strong>Estado nuevo:</strong> {notificacionSeleccionada.datos_adicionales.estado_nuevo}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, textAlign: 'center', py: 4 }}>
                          Haz clic en una notificación de la lista para ver sus detalles completos.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Card>
          )}
        </section>
      </main>
    </Box>
  );
}