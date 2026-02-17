// frontend/src/components/usuario/CambiarContrasenaForm.tsx
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
  Box,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { UsuarioService } from '@/services/usuarios/usuario.service';
import { CambiarContrasenaFormProps } from '../ui/cambiarContrasenaFormProps';
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
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
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

    if (formData.nueva_contrasena.length < 8) {
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
      <DialogTitle>Cambiar contraseña</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Contraseña cambiada exitosamente</Alert>}

          <TextField
            fullWidth
            type={showActual ? 'text' : 'password'}
            label="Contraseña Actual"
            value={formData.contrasena_actual}
            onChange={handleChange('contrasena_actual')}
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowActual(!showActual)} edge="end">
                    {showActual ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            type={showNueva ? 'text' : 'password'}
            label="Nueva Contraseña"
            value={formData.nueva_contrasena}
            onChange={handleChange('nueva_contrasena')}
            margin="normal"
            helperText="Mínimo 8 caracteres"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNueva(!showNueva)} edge="end">
                    {showNueva ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            type={showConfirmar ? 'text' : 'password'}
            label="Confirmar Nueva Contraseña"
            value={formData.confirmar_contrasena}
            onChange={handleChange('confirmar_contrasena')}
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirmar(!showConfirmar)} edge="end">
                    {showConfirmar ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Cambiando...' : 'Cambiar contraseña'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CambiarContrasenaForm;
