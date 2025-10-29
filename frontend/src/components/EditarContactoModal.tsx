// frontend/src/components/EditarContactoModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Modal,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { getSession } from 'next-auth/react';

interface ContactoBancario {
  id: string;
  numero_cuenta: string;
  nombre_banco: string;
  tipo_cuenta: string;
  moneda: string;
  email_contacto?: string;
  telefono_contacto?: string;
}

interface EditarContactoModalProps {
  open: boolean;
  onClose: () => void;
  contacto: ContactoBancario | null;
  onContactoActualizado: (contacto: ContactoBancario) => void;
}

const EditarContactoModal: React.FC<EditarContactoModalProps> = ({ 
  open, 
  onClose, 
  contacto, 
  onContactoActualizado 
}) => {
  const [formData, setFormData] = useState({
    numero_cuenta: '',
    tipo_cuenta: 'ahorros',
    moneda: 'USD',
    nombre_banco: '',
    email_contacto: '',
    telefono_contacto: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (contacto) {
      setFormData({
        numero_cuenta: contacto.numero_cuenta || '',
        tipo_cuenta: contacto.tipo_cuenta || 'ahorros',
        moneda: contacto.moneda || 'USD',
        nombre_banco: contacto.nombre_banco || '',
        email_contacto: contacto.email_contacto || '',
        telefono_contacto: contacto.telefono_contacto || ''
      });
    }
  }, [contacto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const session = await getSession();
      if (!contacto?.id) {
        throw new Error('ID de contacto no válido');
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      // Excluir campos no modificables antes de enviar
      const { numero_cuenta, email_contacto, ...editableFields } = formData;

      const response = await fetch(`${API_URL}/contactos-bancarios/${contacto.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(editableFields)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Contacto actualizado exitosamente');
        if (onContactoActualizado) {
          onContactoActualizado(data.data);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(data.message || 'Error al actualizar contacto');
      }
    } catch (error: any) {
      console.error('Error actualizando contacto:', error);
      setError(error.message || 'Error al actualizar contacto');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setFormData({
      numero_cuenta: '',
      tipo_cuenta: 'ahorros',
      moneda: 'USD',
      nombre_banco: '',
      email_contacto: '',
      telefono_contacto: ''
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 2,
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <Typography variant="h5" gutterBottom>
          Editar Contacto Bancario
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Campo no editable */}
            <TextField
              label="Número de Cuenta *"
              value={formData.numero_cuenta}
              fullWidth
              size="small"
              disabled
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
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

            <TextField
              label="Nombre del Banco"
              value={formData.nombre_banco}
              onChange={(e) => setFormData({...formData, nombre_banco: e.target.value})}
              fullWidth
              size="small"
            />

            {/* Campo no editable */}
            <TextField
              label="Email de Contacto"
              type="email"
              value={formData.email_contacto}
              fullWidth
              size="small"
              disabled
            />

            <TextField
              label="Teléfono de Contacto"
              value={formData.telefono_contacto}
              onChange={(e) => setFormData({...formData, telefono_contacto: e.target.value})}
              fullWidth
              size="small"
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={handleClose} disabled={loading} variant="outlined">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </Box>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};

export default EditarContactoModal;
