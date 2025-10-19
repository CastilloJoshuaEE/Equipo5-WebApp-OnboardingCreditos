'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box
} from '@mui/material';
import { UsuarioService } from '@/services/usuario.service';

interface CambiarContrasenaFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CambiarContrasenaForm: React.FC<CambiarContrasenaFormProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    contrasena_actual: '',
    nueva_contrasena: '',
    confirmar_contrasena: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError('');
  };

  const handleSubmit = async () => {
    if (formData.nueva_contrasena !== formData.confirmar_contrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.nueva_contrasena.length < 6) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const result = await UsuarioService.cambiarContrasena(formData);
      
      if (result.success) {
        setSuccess(true);
        setFormData({
          contrasena_actual: '',
          nueva_contrasena: '',
          confirmar_contrasena: ''
        });
        onSuccess?.();
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.message || 'Error al cambiar la contraseña');
      }
    } catch (error: any) {
      setError(error.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      contrasena_actual: '',
      nueva_contrasena: '',
      confirmar_contrasena: ''
    });
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cambiar Contraseña</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Contraseña cambiada exitosamente
            </Alert>
          )}
          
          <TextField
            fullWidth
            type="password"
            label="Contraseña Actual"
            value={formData.contrasena_actual}
            onChange={handleChange('contrasena_actual')}
            margin="normal"
          />
          
          <TextField
            fullWidth
            type="password"
            label="Nueva Contraseña"
            value={formData.nueva_contrasena}
            onChange={handleChange('nueva_contrasena')}
            margin="normal"
            helperText="Mínimo 8 caracteres"
          />
          
          <TextField
            fullWidth
            type="password"
            label="Confirmar Nueva Contraseña"
            value={formData.confirmar_contrasena}
            onChange={handleChange('confirmar_contrasena')}
            margin="normal"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CambiarContrasenaForm;