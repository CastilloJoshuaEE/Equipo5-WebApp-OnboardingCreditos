'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Save,
  ArrowBack,
  Person,
  Business
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CambiarContrasenaForm from '@/components/usuario/CambiarContrasenaForm';

// Tipos
interface SolicitanteShape {
  id?: string;
  tipo?: string;
  nombre_empresa?: string;
  cuit?: string;
  representante_legal?: string;
  domicilio?: string;
  created_at?: string;
  updated_at?: string;
}

interface PerfilUsuario {
  id: string;
  email: string;
  nombre_completo: string;
  telefono: string;
  dni?: string;
  rol: 'solicitante' | 'operador';
  cuenta_activa?: boolean;
  created_at?: string;
  updated_at?: string;
  // Puede venir como array (relación supabase) o como objeto o como campos planos
  solicitantes?: SolicitanteShape[] | SolicitanteShape;
  // o también (en algunos endpoints) los campos pueden venir «a nivel raíz»
  nombre_empresa?: string;
  cuit?: string;
  representante_legal?: string;
  domicilio?: string;
  direccion?: string;
  email_recuperacion?: string;
}

interface FormData {
  nombre_completo: string;
  telefono: string;
  direccion: string;
  nombre_empresa?: string;
  cuit?: string;
  representante_legal?: string;
  domicilio_empresa?: string;
}

interface Errors {
  nombre_completo?: string;
  telefono?: string;
  direccion?: string;
  nombre_empresa?: string;
  cuit?: string;
  representante_legal?: string;
  domicilio_empresa?: string;
}

const EditarPerfil = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const [modalContrasenaOpen, setmodalContrasenaOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombre_completo: '',
    telefono: '',
    direccion: '',
    nombre_empresa: '',
    cuit: '',
    representante_legal: '',
    domicilio_empresa: ''
  });
  const [errors, setErrors] = useState<Errors>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Esperar a que session esté disponible antes de cargar
  useEffect(() => {
    if (session?.accessToken) {
      cargarPerfilParaEditar();
    } else {
      // si no hay session aún, dejamos loading hasta que cambie
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const cargarPerfilParaEditar = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/usuario/perfil`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPerfil(result.data);
          inicializarFormData(result.data);
        } else {
          console.error('API respondió sin éxito:', result);
          mostrarSnackbar(result.message || 'No se pudo obtener perfil', 'error');
        }
      } else {
        const text = await response.text();
        console.error('Error HTTP al pedir perfil:', response.status, text);
        mostrarSnackbar('Error al cargar el perfil', 'error');
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
      mostrarSnackbar('Error al cargar el perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Inicializa formData manejando múltiples formas en que puede venir la info
  const inicializarFormData = (perfilData: PerfilUsuario) => {
    const data: FormData = {
      nombre_completo: perfilData.nombre_completo || '',
      telefono: perfilData.telefono || '',
      direccion: perfilData.direccion || '',
    };

    // 1) Si viene solicitantes como array -> usar el primer elemento
    if (perfilData.solicitantes) {
      const solicitantes = perfilData.solicitantes;
      let solicitante: SolicitanteShape | undefined;

      if (Array.isArray(solicitantes)) {
        if (solicitantes.length > 0) solicitante = solicitantes[0];
      } else {
        // ya es un objeto
        solicitante = solicitantes as SolicitanteShape;
      }

      if (solicitante) {
        data.nombre_empresa = solicitante.nombre_empresa || solicitante['nombre_empresa'] || '';
        data.cuit = solicitante.cuit || '';
        data.representante_legal = solicitante.representante_legal || '';
        data.domicilio_empresa = solicitante.domicilio || '';
      }
    } 

    // 2) Si la API devolvió campos a nivel raíz (nombre_empresa, cuit, etc.)
    if (!data.nombre_empresa && perfilData.nombre_empresa) {
      data.nombre_empresa = perfilData.nombre_empresa;
    }
    if (!data.cuit && perfilData.cuit) {
      data.cuit = perfilData.cuit;
    }
    if (!data.representante_legal && perfilData.representante_legal) {
      data.representante_legal = perfilData.representante_legal;
    }
    if (!data.domicilio_empresa && perfilData.domicilio) {
      data.domicilio_empresa = perfilData.domicilio;
    }

    setFormData(data);
  };

  const handleInputChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
    
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validarFormulario = (): boolean => {
    const newErrors: Errors = {};

    if (formData.nombre_completo.trim().length < 2) {
      newErrors.nombre_completo = 'El nombre debe tener al menos 2 caracteres';
    }

    if (formData.telefono) {
      const telefonoRegex = /^(\+?\d{1,4})?[\s\-]?\(?(\d{1,4})?\)?[\s\-]?(\d{3,4})[\s\-]?(\d{3,4})$/;
      if (!telefonoRegex.test(formData.telefono)) {
        newErrors.telefono = 'Formato de teléfono inválido';
      }
    }

    if (perfil?.rol === 'solicitante') {
      if (formData.nombre_empresa && formData.nombre_empresa.trim().length < 2) {
        newErrors.nombre_empresa = 'El nombre de empresa debe tener al menos 2 caracteres';
      }
      if (formData.cuit && !/^\d{2}-\d{8}-\d{1}$/.test(formData.cuit)) {
        newErrors.cuit = 'Formato de CUIT inválido. Use: 30-12345678-9';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGuardar = async () => {
    if (!validarFormulario()) {
      mostrarSnackbar('Por favor corrige los errores en el formulario', 'error');
      return;
    }

    try {
      setSaving(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      const datosEnviar: any = {
        nombre_completo: formData.nombre_completo,
        telefono: formData.telefono,
        direccion: formData.direccion,
      };

      // Solo agregar estos si el usuario es solicitante
      if (perfil?.rol === 'solicitante') {
        datosEnviar.nombre_empresa = formData.nombre_empresa;
        datosEnviar.cuit = formData.cuit;
        datosEnviar.representante_legal = formData.representante_legal;
        datosEnviar.domicilio = formData.domicilio_empresa;
      }

      const response = await fetch(`${API_URL}/usuario/editar-perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(datosEnviar),
      });

      const result = await response.json();

      if (result.success) {
        mostrarSnackbar('Perfil actualizado exitosamente', 'success');
        setTimeout(() => router.push('/usuario/perfil'), 1500);
      } else {
        mostrarSnackbar(result.message || 'Error al actualizar el perfil', 'error');
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      mostrarSnackbar('Error al actualizar el perfil', 'error');
    } finally {
      setSaving(false);
    }
  };


  const handleCancelar = () => router.push('/usuario/perfil');

  const mostrarSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button startIcon={<ArrowBack />} onClick={handleCancelar} sx={{ mr: 2 }}>
            Volver
          </Button>
          <Typography variant="h4">Editar Perfil</Typography>
        </Box>

        {perfil && (
          <Grid container spacing={4}>
            {/* Información Personal */}
                    <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 1 }} /> Información Personal
                  </Typography>

                  <TextField
                    fullWidth
                    label="Nombre Completo"
                    value={formData.nombre_completo}
                    onChange={handleInputChange('nombre_completo')}
                    error={!!errors.nombre_completo}
                    helperText={errors.nombre_completo}
                    margin="normal"
                  />

                  <TextField
                    fullWidth
                    label="Teléfono"
                    value={formData.telefono}
                    onChange={handleInputChange('telefono')}
                    error={!!errors.telefono}
                    helperText={errors.telefono || 'Ejemplo: +54 11 1234-5678'}
                    margin="normal"
                  />
                  
                  <TextField
                    fullWidth
                    label="Email"
                    value={perfil.email}
                    margin="normal"
                    disabled
                    helperText="El email no se puede modificar"
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Panel derecho */}
                    <Grid size={{ xs: 12, md: 6 }}>
              {perfil.rol === 'solicitante' && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Business sx={{ mr: 1 }} /> Información de la Empresa
                    </Typography>
                    <TextField
                      fullWidth
                      label="Nombre de la Empresa"
                      value={formData.nombre_empresa || ''}
                      onChange={handleInputChange('nombre_empresa')}
                      error={!!errors.nombre_empresa}
                      helperText={errors.nombre_empresa}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="CUIT"
                      value={formData.cuit || ''}
                      onChange={handleInputChange('cuit')}
                      error={!!errors.cuit}
                      helperText={errors.cuit || 'Formato: 30-12345678-9'}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Representante Legal"
                      value={formData.representante_legal || ''}
                      onChange={handleInputChange('representante_legal')}
                      error={!!errors.representante_legal}
                      helperText={errors.representante_legal}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Domicilio de la Empresa"
                      value={formData.domicilio_empresa || ''}
                      onChange={handleInputChange('domicilio_empresa')}
                      error={!!errors.domicilio_empresa}
                      helperText={errors.domicilio_empresa}
                      margin="normal"
                      multiline
                      rows={2}
                    />
                  </CardContent>
                </Card>
              )}

              {perfil.rol === 'operador' && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Información de Operador
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Puedes cambiar tu contraseña desde aquí.
                    </Typography>
                    <Button
                      variant="outlined"
                      sx={{ mt: 2 }}
                      onClick={() => setmodalContrasenaOpen(true)}
                    >
                      Cambiar Contraseña
                    </Button>
                  </CardContent>
                </Card>
              )}
            </Grid>

            {/* Botones */}
                    <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="outlined" onClick={handleCancelar} disabled={saving}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  onClick={handleGuardar}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}
      </Paper>

      <CambiarContrasenaForm
        open={modalContrasenaOpen}
        onClose={() => setmodalContrasenaOpen(false)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditarPerfil;
