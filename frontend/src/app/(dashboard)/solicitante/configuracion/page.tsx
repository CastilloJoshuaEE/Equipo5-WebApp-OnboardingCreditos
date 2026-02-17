// frontend/src/app/(dashboard)/solicitante/configuracion/page.tsx
'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Divider
} from '@mui/material';
import { useSession } from 'next-auth/react';
import DesactivarCuentaModal from '@/components/usuario/DesactivarCuentaModal';
import EmailRecuperacionForm from '@/components/usuario/EmailRecuperacionForm';

export default function ConfiguracionPage() {
  const { data: session } = useSession();
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  const handleDesactivarCuenta = async (password: string, motivo?: string) => {
    const response = await fetch('/api/usuario/desactivar-cuenta', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password, motivo }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    setMessage('Cuenta desactivada exitosamente. Serás redirigido...');
    
    // Salir y redirigir
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Configuración de cuenta
      </Typography>

      {message && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}

      {/* Email de Recuperación */}
      <Box sx={{ mb: 4 }}>
        <EmailRecuperacionForm />
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Desactivar Cuenta */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom color="error">
            Zona de peligro
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Una vez que desactives tu cuenta, no podrás acceder al sistema hasta que la reactives.
          </Typography>

          <Button
            variant="outlined"
            color="error"
            onClick={() => setModalOpen(true)}
            sx={{ mt: 2 }}
          >
            Desactivar mi cuenta
          </Button>
        </CardContent>
      </Card>

      <DesactivarCuentaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleDesactivarCuenta}
      />
    </Box>
  );
}