// frontend/src/components/BotonIniciarFirma.tsx
import { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Alert,
  Typography,
  Box,
  Tooltip,
  Backdrop,
  CircularProgress
} from '@mui/material';
import { EditDocument, WarningAmber, Info } from '@mui/icons-material';
import { getSession } from 'next-auth/react';
import { BotonIniciarFirmaProps } from './ui/firma';
import { SessionUser } from '@/features/auth/auth.types';
import { TransferenciaEstado } from '@/features/transferencias/transferencia.types';
const BotonIniciarFirma = ({ solicitudId, onFirmaIniciada }: BotonIniciarFirmaProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [firmaExistente, setFirmaExistente] = useState<any>(null);
  const [userRol, setUserRol] = useState<string>('');
  const [transferenciaEstado, setTransferenciaEstado] = useState<TransferenciaEstado | null>(null);
  const [firmaExpirada, setFirmaExpirada] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState('');

  // Obtener el rol del usuario y verificar transferencia al cargar el componente
  useEffect(() => {
    const obtenerDatosIniciales = async () => {
      try {
        const session = await getSession();
        if (session?.user) {
          const user = session.user as SessionUser;
          setUserRol(user.rol || '');
          
          // Verificar estado de transferencia
          await verificarEstadoTransferencia(solicitudId, session.accessToken);
        }
      } catch (error) {
        console.error('Error obteniendo datos iniciales:', error);
      }
    };

    if (solicitudId) {
      obtenerDatosIniciales();
    }
  }, [solicitudId]);

  // Verificar si existe transferencia bancaria
  const verificarEstadoTransferencia = async (solicitudId: string, token?: string) => {
    try {
      if (!token) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/transferencias/habilitacion/${solicitudId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setTransferenciaEstado(result.data);
        
        // Verificar explícitamente si existe transferencia
        console.log('Estado de transferencia:', {
          existe_transferencia: result.data?.existe_transferencia,
          habilitado: result.data?.habilitado,
          datos: result.data
        });
      }
    } catch (error) {
      console.error('Error verificando estado de transferencia:', error);
    }
  };

  // Mostrar overlay de carga
  const mostrarOverlay = (mensaje: string) => {
    setOverlayMessage(mensaje);
    setShowOverlay(true);
  };

  // Ocultar overlay de carga
  const ocultarOverlay = () => {
    setShowOverlay(false);
    setOverlayMessage('');
  };

  // Verificar si el botón debe estar deshabilitado
  const botonDeshabilitado = () => {
    // Deshabilitar si existe transferencia
    if (transferenciaEstado?.existe_transferencia) {
      return true;
    }
    
    // Deshabilitar si está cargando o no hay solicitudId
    return loading || !solicitudId;
  };

  // Obtener el mensaje para el tooltip
  const getTooltipMessage = () => {
    if (transferenciaEstado?.existe_transferencia) {
      return "La transferencia bancaria ya fue realizada - Proceso completado";
    }
    
    if (firmaExpirada) {
      return "El proceso de firma ha expirado. Contacte para reactivar.";
    }
    
    return "Iniciar proceso de firma digital del contrato";
  };

  // Mensaje de expiración para mostrar en el diálogo - SOLO PARA SOLICITANTE
  const MensajeExpiracion = () => {
    // Solo mostrar si el usuario es solicitante
    if (userRol !== 'solicitante') {
      return null;
    }

    return (
      <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
        <Typography variant="body2" fontWeight="bold">
          . Importante - Plazo de Firma Digital
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          • Tienes <strong>7 días</strong> para completar la firma digital del contrato
        </Typography>
        <Typography variant="body2">
          • Si no se completa la firma en este plazo, la solicitud de crédito será cancelada automáticamente
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          • Para reactivar el proceso después de la expiración, contacta con:
        </Typography>
        <Box sx={{ pl: 2, mt: 1 }}>
          <Typography variant="body2">
            📞 <strong>Teléfono:</strong> +51 987 654 321
          </Typography>
          <Typography variant="body2">
            📧 <strong>Email:</strong> contacto@nexia.com
          </Typography>
        </Box>
      </Alert>
    );
  };

  // Mensaje informativo para operadores
  const MensajeOperador = () => {
    // Solo mostrar si el usuario es operador
    if (userRol !== 'operador') {
      return null;
    }

    return (
      <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
        <Typography variant="body2" fontWeight="bold">
          ℹ️ Información - Proceso de Firma Digital
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          • El solicitante tiene <strong>7 días</strong> para completar la firma digital
        </Typography>
        <Typography variant="body2">
          • Pasado este plazo, la solicitud se marcará como expirada automáticamente
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          • Puedes reiniciar el proceso de firma si es necesario
        </Typography>
      </Alert>
    );
  };

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
      mostrarOverlay('Iniciando proceso de firma digital...');

      console.log('. Verificando solicitudId:', solicitudId);

      if (!solicitudId) {
        setError('ID de solicitud no disponible');
        ocultarOverlay();
        return;
      }

      const session = await getSession();
      if (!session?.accessToken) {
        setError('No estás autenticado');
        ocultarOverlay();
        return;
      }

      console.log('. Iniciando firma para solicitud:', solicitudId);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      // Primero, intentar reiniciar cualquier proceso existente
      setOverlayMessage('Reiniciando proceso existente...');
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

      console.log('. Respuesta de reinicio:', reinicioResponse.status);

      // Luego iniciar el nuevo proceso
      setOverlayMessage('Creando nuevo proceso de firma...');
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
            // Si está expirado, ofrecer renovar (solo para operadores)
            if (userRol === 'operador' && window.confirm('El proceso de firma anterior ha expirado. ¿Deseas crear uno nuevo?')) {
              await handleRenovarFirmaExpirada(solicitudId);
            }
            ocultarOverlay();
            return;
          }
          
          // Si está activo, redirigir directamente
          setError(`Ya existe un proceso de firma activo. Redirigiendo...`);
          setOverlayMessage('Redirigiendo a proceso de firma existente...');
          setTimeout(() => {
            window.location.href = `/firmar-contrato/${firma.id}`;
          }, 2000);
          return;
        }
        
        throw new Error(errorResult.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('. Resultado de firma:', result);

      if (result.success) {
        console.log('. Firma iniciada exitosamente');
        setOverlayMessage('Proceso iniciado exitosamente. Redirigiendo...');
        onFirmaIniciada(result.data);
        
        if (result.data.firma?.id) {
          console.log('. Redirigiendo a:', `/firmar-contrato/${result.data.firma.id}`);
          setTimeout(() => {
            window.location.href = `/firmar-contrato/${result.data.firma.id}`;
          }, 1000);
        } else {
          setError('No se pudo obtener la URL de firma');
          ocultarOverlay();
        }
      } else {
        console.error('. Error en respuesta:', result.message);
        setError(result.message || 'Error al iniciar proceso de firma');
        ocultarOverlay();
      }
    } catch (error: any) {
      console.error('. Error en firma digital:', error);
      setError(error.message || 'Error de conexión al iniciar firma');
      ocultarOverlay();
    } finally {
      setLoading(false);
    }
  };

  const handleRenovarFirmaExpirada = async (solicitudId: string) => {
    try {
      mostrarOverlay('Renovando proceso de firma expirado...');
      
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
        setOverlayMessage('Proceso renovado. Redirigiendo...');
        setTimeout(() => {
          window.location.href = `/firmar-contrato/${result.data.firma_id}`;
        }, 1000);
      } else {
        setError(result.message);
        ocultarOverlay();
      }
    } catch (error) {
      console.error('Error renovando firma expirada:', error);
      setError('Error al renovar proceso de firma');
      ocultarOverlay();
    }
  };

  const handleContinuarFirmaExistente = async () => {
    if (firmaExistente?.id) {
      try {
        mostrarOverlay('Preparando proceso de firma existente...');
        
        // Pequeña pausa para mostrar el overlay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setOverlayMessage('Redirigiendo al editor de firma...');
        
        // Redirigir después de mostrar el mensaje
        setTimeout(() => {
          window.location.href = `/firmar-contrato/${firmaExistente.id}`;
        }, 500);
      } catch (error) {
        console.error('Error continuando con firma existente:', error);
        ocultarOverlay();
      }
    }
  };

  const handleClick = async () => {
    // Si ya existe transferencia, no hacer nada
    if (transferenciaEstado?.existe_transferencia) {
      return;
    }

    const existeFirma = await verificarFirmaExistente();
    
    if (existeFirma && firmaExistente) {
      // Mostrar diálogo de confirmación para continuar con firma existente
      setOpen(true);
    } else {
      // No hay firma existente, proceder normalmente
      setOpen(true);
    }
  };

  // Función para verificar si el usuario es operador
  const esOperador = () => {
    return userRol === 'operador';
  };

  // Función para verificar si el usuario es solicitante
  const esSolicitante = () => {
    return userRol === 'solicitante';
  };

  return (
    <>
      {/* Overlay de carga */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }}
        open={showOverlay}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 2
          }}
        >
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" align="center">
            {overlayMessage}
          </Typography>
          <Typography variant="body2" align="center" sx={{ opacity: 0.8, maxWidth: 300 }}>
            Por favor, espera mientras procesamos tu solicitud...
          </Typography>
        </Box>
      </Backdrop>

      <Tooltip title={getTooltipMessage()} arrow>
        <span>
          <Button
            variant="contained"
            startIcon={<EditDocument />}
            onClick={handleClick}
            color="primary"
            size="small"
            disabled={botonDeshabilitado()}
            sx={{
              opacity: transferenciaEstado?.existe_transferencia ? 0.6 : 1,
              position: 'relative'
            }}
          >
            {transferenciaEstado?.existe_transferencia ? (
              <>
                <Info sx={{ fontSize: 16, mr: 0.5 }} />
                Transferencia Realizada ya no se puede iniciar firma digital
              </>
            ) : (
              'Iniciar Firma Digital'
            )}
          </Button>
        </span>
      </Tooltip>

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

          {/* Mostrar mensaje de expiración SOLO para solicitantes */}
          <MensajeExpiracion />
          
          {/* Mostrar mensaje informativo para operadores */}
          <MensajeOperador />

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
          <Button onClick={() => setOpen(false)} disabled={loading || showOverlay}>
            Cancelar
          </Button>
          
          {firmaExistente ? (
            <>
              <Button 
                onClick={handleContinuarFirmaExistente}
                variant="outlined"
                disabled={loading || showOverlay}
                startIcon={showOverlay ? <CircularProgress size={16} /> : null}
              >
                {showOverlay ? 'Cargando...' : 'Continuar Firma Existente'}
              </Button>
              
              {/* SOLO VISIBLE PARA OPERADORES */}
              {esOperador() && (
                <Button 
                  onClick={handleIniciarFirma}
                  variant="contained"
                  disabled={loading || showOverlay}
                  color="secondary"
                  startIcon={showOverlay ? <CircularProgress size={16} /> : null}
                >
                  {showOverlay ? 'Creando...' : 'Crear Nueva Firma'}
                </Button>
              )}
            </>
          ) : (
            <Button 
              onClick={handleIniciarFirma} 
              variant="contained"
              disabled={loading || showOverlay || !solicitudId}
              startIcon={showOverlay ? <CircularProgress size={16} /> : null}
            >
              {showOverlay ? 'Iniciando...' : 'Continuar a Firma'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BotonIniciarFirma;