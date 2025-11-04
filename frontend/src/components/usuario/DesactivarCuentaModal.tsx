'use client';
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Typography,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface DesactivarCuentaModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string, motivo?: string) => Promise<void>;
}

export default function DesactivarCuentaModal({
  open,
  onClose,
  onConfirm
}: DesactivarCuentaModalProps) {
  const [password, setPassword] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async () => {
    if (!password) {
      setError('La contraseña es requerida');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onConfirm(password, motivo);
      setPassword('');
      setMotivo('');
      onClose();
    } catch (error: any) {
      setError(error.message || 'Error al desactivar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setMotivo('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div" color="error">
          Desactivar cuenta
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Esta acción desactivará tu cuenta. No podrás acceder al sistema hasta que reactives tu cuenta.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Contraseña actual"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
          helperText="Ingresa tu contraseña actual para confirmar"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleTogglePassword} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <TextField
          label="Motivo (opcional)"
          multiline
          rows={3}
          fullWidth
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          margin="normal"
          placeholder="¿Por qué deseas desactivar tu cuenta?"
        />

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Importante:</strong> Para reactivar tu cuenta, simplemente inicia sesión nuevamente con tu email y contraseña.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          color="error"
          variant="contained"
          disabled={loading || !password}
        >
          {loading ? 'Desactivando...' : 'Desactivar Cuenta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
