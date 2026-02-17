// frontend/src/app/404.tsx
'use client';
import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="100vh"
      gap={3}
      p={3}
    >
      <Typography variant="h1" component="h1" fontWeight="bold" color="primary">
        404
      </Typography>
      <Typography variant="h4" component="h2" textAlign="center">
        Página No Encontrada
      </Typography>
      <Typography variant="body1" textAlign="center" color="text.secondary">
        La página que estás buscando no existe o ha sido movida.
      </Typography>
      <Box display="flex" gap={2} mt={2}>
        <Button 
          variant="contained" 
          onClick={() => router.push('/')}
        >
          Ir al Inicio
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => router.back()}
        >
          Volver Atrás
        </Button>
      </Box>
    </Box>
  );
}