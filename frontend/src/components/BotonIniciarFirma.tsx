// components/BotonIniciarFirma.tsx - . .
import { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Alert,
  Typography,
  Box 
} from '@mui/material';
import { EditDocument, WarningAmber } from '@mui/icons-material';
import { getSession } from 'next-auth/react';

interface BotonIniciarFirmaProps {
  solicitudId: string;
  onFirmaIniciada: (data: any) => void;
}

const BotonIniciarFirma = ({ solicitudId, onFirmaIniciada }: BotonIniciarFirmaProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [firmaExistente, setFirmaExistente] = useState<any>(null);

  const verificarFirmaExistente = async () => {
    try {
      const session = await getSession();
      if (!session?.accessToken) {
        setError('No estás autenticado');
        return false;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/firmas/verificar-existente/${solicitudId}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.firma_existente) {
          setFirmaExistente(result.data.firma_existente);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error verificando firma existente:', error);
      return false;
    }
  };

  const handleIniciarFirma = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('. Verificando solicitudId:', solicitudId);

      if (!solicitudId) {
        setError('ID de solicitud no disponible');
        return;
      }

      const session = await getSession();
      if (!session?.accessToken) {
        setError('No estás autenticado');
        return;
      }

      console.log('📝 Iniciando firma para solicitud:', solicitudId);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      // Primero, intentar reiniciar cualquier proceso existente
      const reinicioResponse = await fetch(`${API_URL}/firmas/reiniciar-proceso/${solicitudId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          forzar_reinicio: true
        }),
      });

      console.log('🔄 Respuesta de reinicio:', reinicioResponse.status);

      // Luego iniciar el nuevo proceso
      const response = await fetch(`${API_URL}/firmas/iniciar-proceso/${solicitudId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          solicitud_id: solicitudId,
          tipo_documento: 'contrato_word',
          forzar_reinicio: true
        }),
      });

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        const errorResult = await response.json();
        console.error('. Error del servidor:', errorResult);
        
        // Manejar caso de firma existente
        if (response.status === 400 && errorResult.data?.firma_existente) {
          const firma = errorResult.data.firma_existente;
          
          if (firma.estado === 'expirado') {
            // Si está expirado, ofrecer renovar
            if (window.confirm('El proceso de firma anterior ha expirado. ¿Deseas crear uno nuevo?')) {
              await handleRenovarFirmaExpirada(solicitudId);
            }
            return;
          }
          
          // Si está activo, redirigir directamente
          setError(`Ya existe un proceso de firma activo. Redirigiendo...`);
          setTimeout(() => {
            window.location.href = `/firmar-contrato/${firma.id}`;
          }, 2000);
          return;
        }
        
        throw new Error(errorResult.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📄 Resultado de firma:', result);

      if (result.success) {
        console.log('. Firma iniciada exitosamente');
        onFirmaIniciada(result.data);
        
        if (result.data.firma?.id) {
          console.log('🔄 Redirigiendo a:', `/firmar-contrato/${result.data.firma.id}`);
          window.location.href = `/firmar-contrato/${result.data.firma.id}`;
        } else {
          setError('No se pudo obtener la URL de firma');
        }
      } else {
        console.error('. Error en respuesta:', result.message);
        setError(result.message || 'Error al iniciar proceso de firma');
      }
    } catch (error: any) {
      console.error('. Error en firma digital:', error);
      setError(error.message || 'Error de conexión al iniciar firma');
    } finally {
      setLoading(false);
    }
  };

  const handleRenovarFirmaExpirada = async (solicitudId: string) => {
    try {
      const session = await getSession();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${API_URL}/firmas/renovar-expirada/${solicitudId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        window.location.href = `/firmar-contrato/${result.data.firma_id}`;
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error renovando firma expirada:', error);
      setError('Error al renovar proceso de firma');
    }
  };

  const handleContinuarFirmaExistente = () => {
    if (firmaExistente?.id) {
      window.location.href = `/firmar-contrato/${firmaExistente.id}`;
    }
  };

  const handleClick = async () => {
    const existeFirma = await verificarFirmaExistente();
    
    if (existeFirma && firmaExistente) {
      // Mostrar diálogo de confirmación para continuar con firma existente
      setOpen(true);
    } else {
      // No hay firma existente, proceder normalmente
      setOpen(true);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<EditDocument />}
        onClick={handleClick}
        color="primary"
        size="small"
        disabled={!solicitudId}
      >
        Iniciar Firma Digital
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {firmaExistente ? 'Continuar Proceso de Firma' : 'Iniciar Proceso de Firma Digital'}
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {!solicitudId && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No se pudo obtener el ID de la solicitud. Por favor, recarga la página.
            </Alert>
          )}

          {firmaExistente ? (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }} icon={<WarningAmber />}>
                Ya existe un proceso de firma en curso para esta solicitud.
              </Alert>
              
              <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <strong>Información del proceso existente:</strong>
                <br />• Estado: {firmaExistente.estado}
                <br />• Creado: {new Date(firmaExistente.created_at).toLocaleString()}
                <br />• Expira: {new Date(firmaExistente.fecha_expiracion).toLocaleString()}
              </Box>
              
              <Typography variant="body2" sx={{ mt: 2 }}>
                ¿Deseas continuar con el proceso de firma existente o crear uno nuevo?
              </Typography>
            </Box>
          ) : (
            <Box>
              <p>
                ¿Estás seguro de que deseas iniciar el proceso de firma digital para esta solicitud?
              </p>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                Se abrirá el editor de documentos donde podrás:
                <br />• Revisar el contrato completo
                <br />• Agregar tu firma digital en la posición deseada
                <br />• Guardar el documento firmado con validez legal
                <br />• Generar hash único para integridad del documento
              </Alert>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          
          {firmaExistente ? (
            <>
              <Button 
                onClick={handleContinuarFirmaExistente}
                variant="outlined"
                disabled={loading}
              >
                Continuar Firma Existente
              </Button>
              <Button 
                onClick={handleIniciarFirma}
                variant="contained"
                disabled={loading}
                color="secondary"
              >
                Crear Nueva Firma
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleIniciarFirma} 
              variant="contained"
              disabled={loading || !solicitudId}
            >
              {loading ? 'Iniciando...' : 'Continuar a Firma'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BotonIniciarFirma;