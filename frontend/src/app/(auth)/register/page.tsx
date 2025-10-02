import React from 'react';
import RegisterForm from '@/components/auth/RegisterForm';
import { Box } from '@mui/material';

// Página de registro pública.
export default function RegisterPage() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', py: 4 }}>
      <RegisterForm />
    </Box>
  );
}