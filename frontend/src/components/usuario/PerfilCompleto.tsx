// frontend/src/components/usuario/PerfilCompleto.tsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { 
  Person, 
  Business, 
  Phone, 
  Email, 
  LocationOn,
  Edit,
  Badge,
  DesktopWindows,
  Dashboard,
  CreditCard,
  Notifications
} from '@mui/icons-material';
import { useSession, signOut } from 'next-auth/react';
import { UsuarioService } from '@/services/usuario.service';
import { PerfilCompleto as PerfilCompletoType, PerfilSolicitante } from '@/types/usuario.types';
import { esPerfilSolicitante } from '@/utils/perfil.utils';
import DesactivarCuentaModal from '@/components/usuario/DesactivarCuentaModal';
import EmailRecuperacionForm from '@/components/usuario/EmailRecuperacionForm';
import CambiarContrasenaForm from '@/components/usuario/CambiarContrasenaForm';
import '@/styles/tabs.css';

export default function PerfilCompleto() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('personal-info');
  const [perfil, setPerfil] = useState<PerfilCompletoType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [modalDesactivarOpen, setModalDesactivarOpen] = useState<boolean>(false);
  const [modalCambiarContrasenaOpen, setModalCambiarContrasenaOpen] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

  useEffect(() => {
    cargarPerfilCompleto();
  }, []);

  const cargarPerfilCompleto = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await UsuarioService.obtenerPerfil();
      if (response.success) {
        setPerfil(response.data as PerfilCompletoType);
      } else {
        setError('Error al cargar el perfil');
      }
    } catch (error: unknown) {
      console.error('Error cargando perfil:', error);
      setError('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleDesactivarCuenta = async (password: string, motivo?: string): Promise<void> => {
    try {
      if (!session?.accessToken) {
        throw new Error('No estás autenticado');
      }

      const response = await UsuarioService.desactivarCuenta({ password, motivo });
      
      if (response.success) {
        setMessage('Cuenta desactivada exitosamente. Serás redirigido...');
        setSnackbarOpen(true);

        // Limpiar localStorage
        if (session?.user?.id) {
          const userId = session.user.id;
          localStorage.removeItem(`solicitud_borrador_${userId}`);
          
          // Limpiar todos los borradores
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('solicitud_borrador_')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }

        // Salir y redirigir
        setTimeout(async () => {
          try {
            await signOut({ 
              callbackUrl: '/login?message=cuenta_desactivada',
              redirect: true 
            });
          } catch (logoutError) {
            console.error('Error durante logout:', logoutError);
            window.location.href = '/login?message=cuenta_desactivada';
          }
        }, 2000);

      } else {
        throw new Error(response.message || 'Error al desactivar la cuenta');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al desactivar la cuenta';
      throw new Error(errorMessage);
    }
  };

  const handleEditarPerfil = (): void => {
    window.location.href = '/usuario/editar-perfil';
  };

  const handleCloseSnackbar = (): void => {
    setSnackbarOpen(false);
  };

  const TabHeader = () => (
    <Box className="tab-header">
      <span 
        className={`tab-link ${activeTab === 'personal-info' ? 'active' : ''}`}
        onClick={() => setActiveTab('personal-info')}
      >
        Información personal
      </span>
      <span 
        className={`tab-link ${activeTab === 'account-settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('account-settings')}
      >
        Configuración de cuenta
      </span>
    </Box>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3}>
        <TabHeader />
        
        <Box className="page-content">
          {activeTab === 'personal-info' && (
            <Box id="personal-info" className="tab-section active">
              <Card className="content-box">
                {/* Header del Perfil */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 2 }} />
                    Mi Perfil
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<Edit />}
                    onClick={handleEditarPerfil}
                    className="btn-primary"
                  >
                    Editar Perfil
                  </Button>
                </Box>

                {perfil && (
                  <Grid container spacing={4}>
                    {/* Información Básica */}
        <Grid size={{ xs: 12, md: 6 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <Badge sx={{ mr: 1 }} />
                            Información Personal
                          </Typography>
                          
                          <Box className="form-group">
                            <label>Rol</label>
                            <Chip 
                              label={perfil.rol} 
                              color={perfil.rol === 'operador' ? 'primary' : 'secondary'}
                              size="small"
                              sx={{ display: 'block', width: 'fit-content' }}
                            />
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                              Nombre Completo
                            </Typography>
                            <Typography variant="body1">{perfil.nombre_completo}</Typography>
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                              <Email sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                              Email
                            </Typography>
                            <Typography variant="body1">{perfil.email}</Typography>
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                              <Phone sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                              Teléfono
                            </Typography>
                            <Typography variant="body1">
                              {perfil.telefono || 'No especificado'}
                            </Typography>
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                              DNI
                            </Typography>
                            <Typography variant="body1">{perfil.dni}</Typography>
                          </Box>

                          <Box>
                            <Typography variant="subtitle2" color="textSecondary">
                              Estado de Cuenta
                            </Typography>
                            <Chip 
                              label={perfil.cuenta_activa ? 'Activa' : 'Inactiva'} 
                              color={perfil.cuenta_activa ? 'success' : 'error'}
                              size="small"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Información Específica por Rol */}
        <Grid size={{ xs: 12, md: 6 }}>
                      {esPerfilSolicitante(perfil) && perfil.solicitantes && (
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                              <Business sx={{ mr: 1 }} />
                              Información de la Empresa
                            </Typography>

                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="textSecondary">
                                Nombre de la Empresa
                              </Typography>
                              <Typography variant="body1">
                                {perfil.solicitantes.nombre_empresa}
                              </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="textSecondary">
                                CUIT
                              </Typography>
                              <Typography variant="body1">
                                {perfil.solicitantes.cuit}
                              </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="textSecondary">
                                Representante Legal
                              </Typography>
                              <Typography variant="body1">
                                {perfil.solicitantes.representante_legal}
                              </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="textSecondary">
                                <LocationOn sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                                Domicilio
                              </Typography>
                              <Typography variant="body1">
                                {perfil.solicitantes.domicilio}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography variant="subtitle2" color="textSecondary">
                                Tipo
                              </Typography>
                              <Chip 
                                label={perfil.solicitantes.tipo} 
                                variant="outlined"
                                size="small"
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      )}

                      {/* Información de Sistema */}
                      <Card variant="outlined" sx={{ mt: 3 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Información del Sistema
                          </Typography>
                          <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6}}>
                              <Typography variant="subtitle2" color="textSecondary">
                                Fecha de Registro
                              </Typography>
                              <Typography variant="body2">
                                {new Date(perfil.created_at).toLocaleDateString('es-ES')}
                              </Typography>
                            </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="subtitle2" color="textSecondary">
                                Última Actualización
                              </Typography>
                              <Typography variant="body2">
                                {new Date(perfil.updated_at).toLocaleDateString('es-ES')}
                              </Typography>
                            </Grid>
        <Grid size={{ xs: 12}}>
                              <Typography variant="subtitle2" color="textSecondary">
                                ID de Usuario
                              </Typography>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                {perfil.id}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}
              </Card>
            </Box>
          )}

          {activeTab === 'account-settings' && (
            <Box id="account-settings" className="tab-section active">
              <Card className="content-box">
                <Typography variant="h6" gutterBottom>Configuración de Cuenta</Typography>
                <Typography className="page-subtitle">
                  Gestiona la configuración de seguridad y preferencias de tu cuenta.
                </Typography>

                {/* Cambio de contraseña */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Cambio de contraseña
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Ingresa tu contraseña actual y elige una nueva para actualizar tu acceso.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => setModalCambiarContrasenaOpen(true)}
                  >
                    Cambiar Contraseña
                  </Button>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Email de recuperación */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Email de Recuperación
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configura un email alternativo para recuperar tu cuenta en caso de problemas.
                  </Typography>
                  <EmailRecuperacionForm />
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Zona de peligro */}
                <Box>
                  <Typography variant="h6" gutterBottom color="error">
                    Zona de Peligro
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                    Una vez que desactives tu cuenta, no podrás acceder al sistema hasta que la reactives.
                    Esta acción no se puede deshacer.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setModalDesactivarOpen(true)}
                  >
                    Desactivar Mi Cuenta
                  </Button>
                </Box>
              </Card>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Modal de Cambiar Contraseña */}
      <CambiarContrasenaForm
        open={modalCambiarContrasenaOpen}
        onClose={() => setModalCambiarContrasenaOpen(false)}
        onSuccess={() => {
          setMessage('Contraseña cambiada exitosamente');
          setSnackbarOpen(true);
        }}
      />

      {/* Modal de Desactivar Cuenta */}
      <DesactivarCuentaModal
        open={modalDesactivarOpen}
        onClose={() => setModalDesactivarOpen(false)}
        onConfirm={handleDesactivarCuenta}
      />

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={message}
      />
    </Container>
  );
}