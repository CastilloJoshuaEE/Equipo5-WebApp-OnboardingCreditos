// frontend/src/components/usuario/EliminarCuentaModal.tsx
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
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Warning, Visibility, VisibilityOff } from '@mui/icons-material';
import { EliminarCuentaModalProps } from '../ui/eliminarCuentaModalProps';
export default function EliminarCuentaModal({
  open,
  onClose,
  onConfirm
}: EliminarCuentaModalProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Por favor ingresa tu contraseña para confirmar');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onConfirm(password);
      // El redireccionamiento se maneja en el componente padre
    } catch (error: any) {
      setError(error.message || 'Error al eliminar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setLoading(false);
    setShowPassword(false);
    onClose();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
        <Warning />
        Eliminar Cuenta Permanentemente
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>¡Advertencia: Esta acción no se puede deshacer!</strong>
          </Alert>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Al eliminar tu cuenta:
          </Typography>

          <Box sx={{ mb: 2, pl: 2 }}>
            <Typography variant="body2" color="text.secondary" component="div">
              • Se eliminarán todos tus datos personales
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              • Se borrarán todas tus solicitudes de crédito
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              • Se eliminarán documentos y archivos asociados
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              • Se perderá el acceso a todos los servicios
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ mb: 2 }}>
            Para confirmar esta acción, ingresa tu contraseña:
          </Typography>

          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Contraseña actual"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            error={!!error}
            helperText={error}
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || !password}
            variant="contained"
            color="error"
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Eliminando...' : 'Eliminar Cuenta Permanentemente'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}