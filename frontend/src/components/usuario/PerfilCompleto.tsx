import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardContent, 
  Chip,
  Divider,
  Button,
  Box,
  Alert,
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
  Badge
} from '@mui/icons-material';
import { useSession, signOut } from 'next-auth/react';
import { UsuarioService } from '@/services/usuario.service';
import { PerfilCompleto as PerfilCompletoType, PerfilSolicitante } from '@/types/usuario.types';
import { esPerfilSolicitante } from '@/utils/perfil.utils';
import DesactivarCuentaModal from '@/components/usuario/DesactivarCuentaModal';
import EmailRecuperacionForm from '@/components/usuario/EmailRecuperacionForm';

const PerfilCompleto: React.FC = () => {
  const { data: session } = useSession();
  const [perfil, setPerfil] = useState<PerfilCompletoType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [modalConfigOpen, setModalConfigOpen] = useState<boolean>(false);
  const [modalDesactivarOpen, setModalDesactivarOpen] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

  useEffect(() => {
    cargarPerfilCompleto();
  }, []);

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

        // Cerrar sesión y redirigir
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

  const handleEditarPerfil = (): void => {
    window.location.href = '/usuario/editar-perfil';
  };

  const handleCloseSnackbar = (): void => {
    setSnackbarOpen(false);
  };

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
      <Paper elevation={3} sx={{ p: 4 }}>
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
          >
            Editar Perfil
          </Button>
        </Box>

        {perfil && (
          <Grid container spacing={4}>
            {/* Información Básica */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Badge sx={{ mr: 1 }} />
                    Información Personal
                  </Typography>
                  
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

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Rol
                    </Typography>
                    <Chip 
                      label={perfil.rol} 
                      color={perfil.rol === 'operador' ? 'primary' : 'secondary'}
                      size="small"
                    />
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
                <Card>
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

              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => setModalConfigOpen(true)}
                sx={{ mt: 3 }}
              >
                Configuración
              </Button>
            </Grid>

            {/* Información de Sistema */}
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Información del Sistema
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Fecha de Registro
                      </Typography>
                      <Typography variant="body2">
                        {new Date(perfil.created_at).toLocaleDateString('es-ES')}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Última Actualización
                      </Typography>
                      <Typography variant="body2">
                        {new Date(perfil.updated_at).toLocaleDateString('es-ES')}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
      </Paper>

      {/* Modal de Configuración */}
      <Dialog 
        open={modalConfigOpen} 
        onClose={() => setModalConfigOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" component="div">
            Configuración de Cuenta
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <EmailRecuperacionForm />
            <Box sx={{ my: 4, borderBottom: 1, borderColor: 'divider' }} />
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="error">
                  Zona de Peligro
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Una vez que desactives tu cuenta, no podrás acceder al sistema hasta que la reactives.
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setModalConfigOpen(false);
                    setModalDesactivarOpen(true);
                  }}
                  sx={{ mt: 2 }}
                >
                  Desactivar Mi Cuenta
                </Button>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalConfigOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

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
};

export default PerfilCompleto;