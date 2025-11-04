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
  Container,
  Drawer,
  useMediaQuery,
  useTheme,
  Fab
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
  Clear,
  Menu as MenuIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Notificacion } from '@/services/notificaciones.service';
import notificacionesService from '@/services/notificaciones.service';
import Image from 'next/image';

interface NotificacionConDetalle extends Notificacion {
  solicitudId?: string;
}

export default function NotificacionesPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
  const [detalleOpen, setDetalleOpen] = useState(false);

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
      if (notificacionSeleccionada) {
        setNotificacionSeleccionada(prev => prev ? { ...prev, leida: true } : null);
      }
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  };

  const handleSeleccionarNotificacion = (notificacion: NotificacionConDetalle) => {
    setNotificacionSeleccionada(notificacion);
    if (isMobile) {
      setDetalleOpen(true);
    }
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
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const limpiarFiltros = () => {
    const filtrosLimpiados = {
      recientes: false,
      esteMes: false,
      noLeidas: false
    };
    setFiltros(filtrosLimpiados);
    setFiltrosAplicados(filtrosLimpiados);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleVolverDashboard = () => {
    router.push(rolUsuario === 'operador' ? '/operador' : '/solicitante');
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
      nueva_solicitud: <Box component="span">📥</Box>,
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
    if (!filtrosAplicados.recientes && !filtrosAplicados.esteMes && !filtrosAplicados.noLeidas) {
      return true;
    }

    let cumpleFiltro = true;

    if (filtrosAplicados.recientes) {
      const fechaNotif = new Date(notif.created_at);
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 7);
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

  const hayFiltrosActivos = filtrosAplicados.recientes || filtrosAplicados.esteMes || filtrosAplicados.noLeidas;

  const FiltrosContent = () => (
    <Box className="filters-content">
      <Typography variant="h6" gutterBottom className="filters-title">
        Filtros
      </Typography>
      
      <Box className="filters-container">
        <FormControlLabel
          control={
            <Checkbox
              checked={filtros.recientes}
              onChange={() => handleFiltroChange('recientes')}
              color="primary"
              size={isMobile ? "small" : "medium"}
            />
          }
          label="Últimos 7 días"
          className="filter-checkbox"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filtros.esteMes}
              onChange={() => handleFiltroChange('esteMes')}
              color="primary"
              size={isMobile ? "small" : "medium"}
            />
          }
          label="Este mes"
          className="filter-checkbox"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filtros.noLeidas}
              onChange={() => handleFiltroChange('noLeidas')}
              color="primary"
              size={isMobile ? "small" : "medium"}
            />
          }
          label="No leídas"
          className="filter-checkbox"
        />
      </Box>
      
      <Box className="filter-buttons">
        <Button 
          variant="contained" 
          onClick={aplicarFiltros}
          startIcon={<FilterList />}
          className="btn-primary"
          size={isMobile ? "small" : "medium"}
          fullWidth={isMobile}
        >
          Aplicar Filtros
        </Button>
        <Button 
          variant="outlined" 
          onClick={limpiarFiltros}
          startIcon={<Clear />}
          className="btn-secondary"
          size={isMobile ? "small" : "medium"}
          fullWidth={isMobile}
          disabled={!hayFiltrosActivos}
        >
          Limpiar
        </Button>
      </Box>

      {hayFiltrosActivos && (
        <Box className="active-filters">
          <Typography variant="body2" color="primary" className="active-filters-text">
            Filtros activos: 
            {filtrosAplicados.recientes && " Últimos 7 días"}
            {filtrosAplicados.esteMes && " Este mes"}
            {filtrosAplicados.noLeidas && " No leídas"}
          </Typography>
        </Box>
      )}
    </Box>
  );

  const DetalleNotificacion = () => (
    <Card className="notification-detail-card">
      <CardContent>
        <Box className="detail-header">
          {isMobile && (
            <IconButton 
              onClick={() => setDetalleOpen(false)}
              className="back-button"
              size="small"
            >
              <ArrowBackIcon />
            </IconButton>
          )}
        </Box>

        <Typography variant="h5" className="detail-title">
          {notificacionSeleccionada ? 
            `Detalles de ${notificacionSeleccionada.solicitudId || 'notificación'}` : 
            'Selecciona una notificación'
          }
        </Typography>

        <Typography variant="h6" className="detail-subtitle">
          Resumen
        </Typography>
        <Divider className="detail-divider" />

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
                  <Typography variant="h6" className="timeline-title" sx={{
                    fontWeight: !notificacionSeleccionada.leida ? 'bold' : 'normal',
                    fontSize: isMobile ? '1rem' : '1.1rem'
                  }}>
                    {notificacionSeleccionada.titulo}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" className="timeline-date">
                {formatearFechaCompleta(notificacionSeleccionada.created_at)}
              </Typography>
              <Typography variant="body1" className="timeline-description" sx={{
                fontWeight: !notificacionSeleccionada.leida ? '500' : 'normal',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}>
                {notificacionSeleccionada.mensaje}
              </Typography>
              
              {notificacionSeleccionada.datos_adicionales && (
                <Box className="additional-data-detail">
                  {notificacionSeleccionada.datos_adicionales.solicitud_numero && (
                    <Typography variant="body2" className="additional-data-item">
                      <strong>Solicitud:</strong> {notificacionSeleccionada.datos_adicionales.solicitud_numero}
                    </Typography>
                  )}
                  {notificacionSeleccionada.datos_adicionales.monto && (
                    <Typography variant="body2" className="additional-data-item">
                      <strong>Monto:</strong> ${notificacionSeleccionada.datos_adicionales.monto.toLocaleString()}
                    </Typography>
                  )}
                  {notificacionSeleccionada.datos_adicionales.estado_anterior && (
                    <Typography variant="body2" className="additional-data-item">
                      <strong>Estado anterior:</strong> {notificacionSeleccionada.datos_adicionales.estado_anterior}
                    </Typography>
                  )}
                  {notificacionSeleccionada.datos_adicionales.estado_nuevo && (
                    <Typography variant="body2" className="additional-data-item">
                      <strong>Estado nuevo:</strong> {notificacionSeleccionada.datos_adicionales.estado_nuevo}
                    </Typography>
                  )}
                </Box>
              )}

              {notificacionSeleccionada.solicitud_id && (
                <Box className="detail-actions" sx={{ mt: 2 }}>
                  <Button 
                    variant="contained" 
                    size={isMobile ? "small" : "medium"}
                    onClick={() => {
                      if (rolUsuario === 'solicitante') {
                        window.location.href = `/solicitante/solicitudes/${notificacionSeleccionada.solicitud_id}`;
                      } else if (rolUsuario === 'operador') {
                        window.location.href = `/operador`;
                      } else {
                        window.location.href = `/solicitante/solicitudes/${notificacionSeleccionada.solicitud_id}`;
                      }
                    }}
                    fullWidth={isMobile}
                    className="btn-primary"
                  >
                    {rolUsuario === 'operador' ? 'Ir al dashboard' : 'Ver detalles solicitud'}
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary" className="no-selection-text">
            Haz clic en una notificación de la lista para ver sus detalles completos.
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box className="notificaciones-container">
      {/* Header */}
      <Box className="notificaciones-header">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" className="page-title" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
              Notificaciones
            </Typography>
            <Typography variant="subtitle1" className="page-subtitle" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
              Mantente informado sobre el estado de tus solicitudes y actualizaciones
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {isMobile ? (
              <IconButton 
                onClick={toggleSidebar}
                className="filter-button-mobile"
                color="primary"
              >
                <FilterList />
              </IconButton>
            ) : (
              <Button 
                variant="outlined" 
                onClick={marcarTodasComoLeidas}
                startIcon={<MarkEmailRead />}
                className="btn-secondary"
                size="medium"
              >
                Marcar todas como leídas
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Filtros Desktop */}
      {!isMobile && (
        <Card className="content-box filters-box">
          <FiltrosContent />
        </Card>
      )}

      {/* Filtros Mobile Drawer */}
      {isMobile && (
        <Drawer
          anchor="right"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: '85vw',
              maxWidth: 400,
              p: 2
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Filtros</Typography>
            <IconButton onClick={() => setSidebarOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <FiltrosContent />
        </Drawer>
      )}

      {/* Contenido Principal */}
      {cargando && notificacionesFiltradas.length === 0 ? (
        <Card className="content-box empty-state">
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </Card>
      ) : notificacionesFiltradas.length === 0 ? (
        <Card className="content-box empty-state">
          <Box className="empty-state-content">
            <Image 
              src="/ilustraciones/nohayNotificacion.png" 
              alt="Sin notificaciones"
              width={isMobile ? 200 : 400}
              height={isMobile ? 200 : 400}
              style={{ margin: '0 auto 24px' }}
            />
            <Typography variant="h5" className="empty-state-title" gutterBottom sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
              {hayFiltrosActivos ? "No hay notificaciones que coincidan con los filtros" : "Sin notificaciones recientes"}
            </Typography>
            <Typography variant="body1" className="empty-state-text" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
              {hayFiltrosActivos 
                ? "Intenta con otros filtros o limpia los filtros actuales para ver todas las notificaciones."
                : "Cuando haya novedades sobre tus solicitudes, te lo haremos saber."
              }
            </Typography>
          </Box>
        </Card>
      ) : (
        <Grid container spacing={2} className="notifications-grid">
          {/* Lista de Notificaciones */}
                <Grid size={{ xs: 12, md: 8}}>
            <Card className="content-box">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h5" className="section-title" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                  Historial de Notificaciones
                </Typography>
                {hayFiltrosActivos && (
                  <Chip 
                    label={`${notificacionesFiltradas.length} resultado(s)`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                )}
                {isMobile && (
                  <Button 
                    variant="outlined" 
                    onClick={marcarTodasComoLeidas}
                    startIcon={<MarkEmailRead />}
                    className="btn-secondary"
                    size="small"
                  >
                    Marcar todas leídas
                  </Button>
                )}
              </Box>

              <Typography variant="body2" className="section-subtitle" sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                {notificacionesFiltradas.length} notificaciones encontradas
                {hayFiltrosActivos && " con los filtros aplicados"}
              </Typography>

              <Box className="notifications-list">
                {notificacionesFiltradas.map((notificacion) => (
                  <Card 
                    key={notificacion.id} 
                    className={`notification-card ${notificacionSeleccionada?.id === notificacion.id ? 'selected' : ''} ${!notificacion.leida ? 'no-leida' : ''}`}
                    onClick={() => handleSeleccionarNotificacion(notificacion)}
                  >
                    <CardContent>
                      <Box className="notification-header">
                        <Box className="notification-info">
                          <Typography variant="h6" className="notification-id" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
                            {notificacion.solicitudId || 'Sistema'}
                          </Typography>
                          <Chip 
                            label={obtenerEstadoSolicitud(notificacion.tipo)}
                            className="status-badge"
                            size="small"
                            sx={{ 
                              backgroundColor: obtenerColorEstado(notificacion.tipo),
                              color: 'white',
                              fontSize: { xs: '0.7rem', md: '0.8rem' }
                            }}
                          />
                          {!notificacion.leida && (
                            <Chip
                              label="Nuevo"
                              color="primary"
                              size="small"
                              sx={{ fontWeight: 'bold', fontSize: { xs: '0.7rem', md: '0.8rem' } }}
                            />
                          )}
                        </Box>
                        <Box>
                          {!notificacion.leida && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                marcarComoLeida(notificacion.id);
                              }}
                              color="primary"
                            >
                              <CheckCircle fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" className="notification-date" sx={{ fontSize: { xs: '0.75rem', md: '0.9rem' } }}>
                        {formatearFechaCompleta(notificacion.created_at)}
                      </Typography>
                      
                      <Box className="notification-body">
                        <Typography variant="h6" className="notification-text" sx={{ 
                          fontWeight: notificacion.leida ? 'normal' : 'bold',
                          color: notificacion.leida ? 'text.primary' : 'primary.main',
                          fontSize: { xs: '0.9rem', md: '1rem' }
                        }}>
                          {notificacion.titulo}
                        </Typography>
                        <Typography variant="body2" className="notification-detail" sx={{
                          fontWeight: notificacion.leida ? 'normal' : '500',
                          fontSize: { xs: '0.8rem', md: '0.9rem' }
                        }}>
                          {notificacion.mensaje}
                        </Typography>
                        
                        {notificacion.datos_adicionales && (
                          <Box className="additional-data">
                            {notificacion.datos_adicionales.monto && (
                              <Typography variant="body2" className="notification-detail" sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                                <strong>Monto:</strong> ${notificacion.datos_adicionales.monto.toLocaleString()}
                              </Typography>
                            )}
                            {notificacion.datos_adicionales.estado_anterior && (
                              <Typography variant="body2" className="notification-detail" sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                                <strong>Cambio de estado:</strong> {notificacion.datos_adicionales.estado_anterior} → {notificacion.datos_adicionales.estado_nuevo}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>

                      {!isMobile && notificacion.solicitud_id && (
                        <Box className="notification-actions">
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (rolUsuario === 'solicitante') {
                                window.location.href = `/solicitante/solicitudes/${notificacion.solicitud_id}`;
                              } else if (rolUsuario === 'operador') {
                                window.location.href = `/operador`;
                              } else {
                                window.location.href = `/solicitante/solicitudes/${notificacion.solicitud_id}`;
                              }
                            }}
                          >
                            {rolUsuario === 'operador' ? 'Ir al dashboard' : 'Ver detalles solicitud'}
                          </Button>
                        </Box>
                      )}
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
                      size={isMobile ? "small" : "medium"}
                    >
                      {cargando ? 'Cargando...' : 'Cargar más'}
                    </Button>
                  </Box>
                )}
              </Box>
            </Card>
          </Grid>

          {/* Detalle de Notificación - Desktop */}
          {!isMobile && (
                <Grid size={{ xs: 12, md: 4}}>
              <DetalleNotificacion />
            </Grid>
          )}

          {/* Detalle de Notificación - Mobile Drawer */}
          {isMobile && notificacionSeleccionada && (
            <Drawer
              anchor="bottom"
              open={detalleOpen}
              onClose={() => setDetalleOpen(false)}
              sx={{
                '& .MuiDrawer-paper': {
                  height: '80vh',
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  p: 2
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <Box sx={{ width: 40, height: 4, backgroundColor: 'grey.300', borderRadius: 2 }} />
              </Box>
              <DetalleNotificacion />
            </Drawer>
          )}
        </Grid>
      )}
    </Box>
  );
}