// frontend/src/app/(dashboard)/operador/contactos/nuevo/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { getSession } from 'next-auth/react';
import EditarContactoModal from '@/components/EditarContactoModal';

interface ContactoBancario {
  id: string;
  numero_cuenta: string;
  nombre_banco: string;
  tipo_cuenta: string;
  moneda: string;
  email_contacto?: string;
  telefono_contacto?: string;
  solicitante_id?: string;
}

export default function NuevoContactoPage() {
  const [formData, setFormData] = useState({
    numero_cuenta: '',
    tipo_cuenta: 'ahorros',
    moneda: 'USD',
    email_contacto: '',
    telefono_contacto: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [solicitudId, setSolicitudId] = useState<string>('');
  const [contactos, setContactos] = useState<ContactoBancario[]>([]);
  const [contactoEditando, setContactoEditando] = useState<ContactoBancario | null>(null);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    // Intentar obtener el solicitud_id de diferentes fuentes
    const urlParams = new URLSearchParams(window.location.search);
    const urlSolicitudId = urlParams.get('solicitud_id');
    const storedSolicitudId = sessionStorage.getItem('solicitud_transferencia');
    
    const currentSolicitudId = urlSolicitudId || storedSolicitudId || '';
    setSolicitudId(currentSolicitudId);
    
    // Guardar en sessionStorage para referencia futura
    if (currentSolicitudId) {
      sessionStorage.setItem('solicitud_transferencia', currentSolicitudId);
    }

    // Cargar contactos existentes
    cargarContactos();
  }, []);

  const cargarContactos = async () => {
    try {
      const session = await getSession();
      const response = await fetch(`${API_URL}/contactos-bancarios`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setContactos(data.data);
      }
    } catch (error) {
      console.error('Error cargando contactos:', error);
    }
  };

  const validarFormulario = () => {
    if (!formData.numero_cuenta.trim()) {
      setError('El número de cuenta es requerido');
      return false;
    }
    
    if (formData.email_contacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_contacto)) {
      setError('Formato de email inválido');
      return false;
    }
    
    return true;
  };

  const guardarContacto = async () => {
    if (!validarFormulario()) return;

    try {
      setLoading(true);
      setError(null);
      
      const session = await getSession();
      
      console.log('💾 Guardando contacto bancario:', {
        numero_cuenta: formData.numero_cuenta
      });
      
      const response = await fetch(`${API_URL}/contactos-bancarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({
          numero_cuenta: formData.numero_cuenta,
          tipo_cuenta: formData.tipo_cuenta,
          moneda: formData.moneda,
          email_contacto: formData.email_contacto,
          telefono_contacto: formData.telefono_contacto
        }),
      });

      const data = await response.json();
      console.log('📡 Respuesta guardar contacto:', data);

      if (data.success) {
        setSuccess('Contacto bancario guardado exitosamente');
        
        // Limpiar formulario
        setFormData({
          numero_cuenta: '',
          tipo_cuenta: 'ahorros',
          moneda: 'USD',
          email_contacto: '',
          telefono_contacto: ''
        });
        
        // Recargar lista de contactos
        await cargarContactos();
        
        setTimeout(() => {
          if (solicitudId) {
            // Redirigir a la página de transferencias con el solicitud_id
            window.location.href = `/operador/transferencias/nueva?solicitud_id=${solicitudId}`;
          }
        }, 2000);
      } else {
        throw new Error(data.message || 'Error al guardar contacto');
      }
    } catch (error: any) {
      console.error('. Error guardando contacto:', error);
      setError('Error al guardar el contacto. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditarContacto = (contacto: ContactoBancario) => {
    setContactoEditando(contacto);
    setModalEditarAbierto(true);
  };

  const handleEliminarContacto = async (contactoId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este contacto?')) {
      return;
    }

    try {
      const session = await getSession();
      
      const response = await fetch(`${API_URL}/contactos-bancarios/${contactoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Contacto eliminado exitosamente');
        // Recargar la lista de contactos
        await cargarContactos();
      } else {
        throw new Error(data.message || 'Error al eliminar contacto');
      }
    } catch (error: any) {
      setError('Error al eliminar contacto: ' + error.message);
    }
  };

  const handleContactoActualizado = (contactoActualizado: ContactoBancario) => {
    // Actualizar la lista de contactos
    setContactos(prev => prev.map(contacto => 
      contacto.id === contactoActualizado.id ? contactoActualizado : contacto
    ));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Typography variant="h4" component="h1" gutterBottom>
        GESTIÓN DE CONTACTOS BANCARIOS
      </Typography>

      {/* Mostrar mensajes de error/success */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Formulario para nuevo contacto */}
      <Card>
        <CardHeader title="NUEVO CONTACTO BANCARIO" />
        <CardContent>
          <Box className="space-y-4">
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                NRO. DE CUENTA *
              </Typography>
              <TextField
                placeholder="Número de cuenta bancaria"
                value={formData.numero_cuenta}
                onChange={(e) => setFormData({...formData, numero_cuenta: e.target.value})}
                fullWidth
                size="small"
                required
                error={!formData.numero_cuenta.trim()}
                helperText={!formData.numero_cuenta.trim() ? "Campo obligatorio" : ""}
              />
            </Box>
            
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Cuenta</InputLabel>
                <Select
                  value={formData.tipo_cuenta}
                  onChange={(e) => setFormData({...formData, tipo_cuenta: e.target.value})}
                  label="Tipo de Cuenta"
                >
                  <MenuItem value="ahorros">Ahorros</MenuItem>
                  <MenuItem value="corriente">Corriente</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Moneda</InputLabel>
                <Select
                  value={formData.moneda}
                  onChange={(e) => setFormData({...formData, moneda: e.target.value})}
                  label="Moneda"
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="ARS">ARS</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Correo electrónico de contacto
              </Typography>
              <TextField
                type="email"
                placeholder="email@ejemplo.com"
                value={formData.email_contacto}
                onChange={(e) => setFormData({...formData, email_contacto: e.target.value})}
                fullWidth
                size="small"
              />
            </Box>
            
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Teléfono de contacto
              </Typography>
              <TextField
                placeholder="+1 234 567 8900"
                value={formData.telefono_contacto}
                onChange={(e) => setFormData({...formData, telefono_contacto: e.target.value})}
                fullWidth
                size="small"
              />
            </Box>
          </Box>

          <Box className="text-center mt-4">
            <Button 
              onClick={guardarContacto} 
              variant="contained" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!formData.numero_cuenta.trim() || loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Guardando...' : 'GUARDAR CONTACTO BANCARIO'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Lista de contactos existentes */}
      {contactos.length > 0 && (
        <Card>
          <CardHeader title="CONTACTOS EXISTENTES" />
          <CardContent>
            <Box className="space-y-4">
              {contactos.map((contacto) => (
                <Box 
                  key={contacto.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <Box className="flex justify-between items-center">
                    <Box>
                      <Typography variant="h6" className="font-semibold">
                        Cuenta: {contacto.numero_cuenta}
                      </Typography>
                      <Typography>Banco: {contacto.nombre_banco}</Typography>
                      <Typography>Tipo: {contacto.tipo_cuenta} - {contacto.moneda}</Typography>
                      {contacto.email_contacto && (
                        <Typography>Email: {contacto.email_contacto}</Typography>
                      )}
                      {contacto.telefono_contacto && (
                        <Typography>Teléfono: {contacto.telefono_contacto}</Typography>
                      )}
                    </Box>
                    <Box className="flex gap-2">
                      <Button 
                        onClick={() => handleEditarContacto(contacto)}
                        variant="outlined"
                        color="primary"
                        size="small"
                      >
                        Editar
                      </Button>
                      <Button 
                        onClick={() => handleEliminarContacto(contacto.id)}
                        variant="outlined"
                        color="error"
                        size="small"
                      >
                        Eliminar
                      </Button>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Botones de navegación */}
      <Box className="text-center space-y-2">
        {solicitudId && (
          <Button 
            onClick={() => window.location.href = `/operador/transferencias/nueva?solicitud_id=${solicitudId}`}
            variant="outlined"
            className="mt-2"
          >
            Volver a Transferencias
          </Button>
        )}
        <Button 
          variant="outlined" 
          onClick={() => window.location.href = '/operador'}
          sx={{ mt: 2, ml: 2 }}
        >
          Volver al Dashboard
        </Button>
      </Box>

      {/* Modal de edición */}
      <EditarContactoModal
        open={modalEditarAbierto}
        onClose={() => {
          setModalEditarAbierto(false);
          setContactoEditando(null);
        }}
        contacto={contactoEditando}
        onContactoActualizado={handleContactoActualizado}
      />
    </div>
  );
}