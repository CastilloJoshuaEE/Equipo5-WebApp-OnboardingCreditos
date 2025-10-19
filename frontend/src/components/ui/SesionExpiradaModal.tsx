'use client';

import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { signOut } from 'next-auth/react';

interface SesionExpiradaModalProps {
  open: boolean;
  onClose?: () => void;
}

const SesionExpiradaModal: React.FC<SesionExpiradaModalProps> = ({ open, onClose }) => {
  const handleCerrarSesion = async () => {
    // Cierra sesión de NextAuth completamente
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>
        Sesión vencida
      </DialogTitle>
      <DialogContent>
        <Typography>
          Tu sesión ha expirado por seguridad. Por favor, inicia sesión nuevamente.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCerrarSesion} color="primary" variant="contained">
          Iniciar sesión nuevamente
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SesionExpiradaModal;
