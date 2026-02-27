// frontend/src/components/ui/LoadingOverlay.tsx
import { CircularProgress, Box, Typography } from '@mui/material';

interface LoadingOverlayProps {
  message?: string;
  show: boolean;
}

export default function LoadingOverlay({ message = 'Verificando conexión con el servidor...', show }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        flexDirection: 'column',
        gap: 3
      }}
    >
      <CircularProgress size={80} thickness={4} />
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
          {message}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          El servidor puede tardar unos segundos en iniciar
        </Typography>
      </Box>
    </Box>
  );
}