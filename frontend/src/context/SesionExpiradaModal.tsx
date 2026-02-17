// frontend/src/context/SesionExpiradaModal.tsx
'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import { signOut } from 'next-auth/react';

interface SesionExpiradaModalProps {
  open: boolean;
}

export default function SesionExpiradaModal({ open }: SesionExpiradaModalProps) {
  const handleCerrarSesion = async () => {
    await signOut({ 
      callbackUrl: '/login',
      redirect: true 
    });
  };

  return (
    <Dialog 
      open={open} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown
      BackdropProps={{
        style: {
          backgroundColor: 'rgba(0,0,0,0.8)'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Warning color="error" />
          <Typography variant="h6" color="error">
            Sesión Expirada
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography>
          Tu sesión ha expirado por seguridad. Por favor, inicia sesión nuevamente para continuar.
        </Typography>
      </DialogContent>
      
      <DialogActions>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleCerrarSesion}
          fullWidth
        >
          Iniciar Sesión
        </Button>
      </DialogActions>
    </Dialog>
  );
}