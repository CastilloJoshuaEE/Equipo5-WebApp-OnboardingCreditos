// pages/firmar-contrato/[firma_id].tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getSession } from 'next-auth/react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Alert,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Description, 
  Download,
  CheckCircle,
  Schedule
} from '@mui/icons-material';
import VisorWordFirma from '@/components/FirmaDigital/VisorWordFirma';

interface DocumentoFirmado {
  firmas: any[];
  fechaFirma: string;
  [key: string]: any;
}

interface InfoFirmaData {
  firma: {
    id: string;
    solicitudes_credito: {
      numero_solicitud: string;
      solicitante_id: string;
      operador_id: string;
    };
    estado: string;
    fecha_expiracion: string;
  };
  fecha_expiracion: string;
  documento: any;
  nombre_documento: string;
  tipo_documento: string;
  solicitante: any;
  hash_original: string;
}

const FirmaContratoPage = () => {
  const router = useRouter();
  const { firma_id } = router.query;  
  const [session, setSession] = useState<any>(null);
  const [infoFirma, setInfoFirma] = useState<InfoFirmaData | null>(null);
  const [documento, setDocumento] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pasoActual, setPasoActual] = useState(0);
  const [firmaCompletada, setFirmaCompletada] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('. Verificando sesión...');
        const sessionData = await getSession();
        console.log('. Datos de sesión:', sessionData);
        
        if (sessionData) {
          setSession(sessionData);
          setError('');
        } else {
          setError('No hay sesión activa');
        }
      } catch (error) {
        console.error('. Error al verificar sesión:', error);
        setError('Error al verificar la sesión');
      } finally {
        setSessionLoading(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (firma_id && !sessionLoading) {
      if (session) {
        cargarInfoFirma();
      } else {
        setLoading(false);
      }
    }
  }, [firma_id, session, sessionLoading]);

  const cargarInfoFirma = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('. Cargando información de firma para:', firma_id);
      console.log('. Token disponible:', !!session?.accessToken);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${API_URL}/firmas/info-firma-word/${firma_id}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          setError('Sesión expirada. Por favor, inicie sesión nuevamente.');
          return;
        }
        
        const errorResult = await response.json();
        console.error('. Error del servidor:', errorResult);
        
        // Si es error 404, intentar reparar automáticamente
        if (response.status === 404) {
          console.log('🛠️ Intentando reparar relación automáticamente...');
          
          const repairResponse = await fetch(`${API_URL}/firmas/${firma_id}/reparar-relacion`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (repairResponse.ok) {
            const repairResult = await repairResponse.json();
            console.log('. Relación reparada:', repairResult);
            
            // Reintentar cargar información
            const retryResponse = await fetch(`${API_URL}/firmas/info-firma-word/${firma_id}`, {
              headers: {
                'Authorization': `Bearer ${session?.accessToken}`,
                'Content-Type': 'application/json'
              }
            });

            if (retryResponse.ok) {
              const retryResult = await retryResponse.json();
              setInfoFirma(retryResult.data);
              setDocumento(retryResult.data.documento);
              setPasoActual(1);
              return;
            }
          }
        }
        
        setError(errorResult.message || `Error ${response.status} al cargar información`);
        return;
      }

      const result = await response.json();
      console.log('. Información cargada exitosamente:', result.success);
      
      if (result.success) {
        setInfoFirma(result.data);
        setDocumento(result.data.documento);
        setPasoActual(1);
      } else {
        setError(result.message || 'Error en la respuesta del servidor');
      }
    } catch (error: any) {
      console.error('. Error cargando información de firma:', error);
      setError(error.message || 'Error de conexión al cargar información');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRetry = async () => {
    setLoading(true);
    setError('');
    
    // Re-verificar sesión
    const newSession = await getSession();
    if (newSession) {
      setSession(newSession);
      await cargarInfoFirma();
    } else {
      setError('No hay sesión activa');
      setLoading(false);
    }
  };
const handleFirmarDocumento = async (documentoFirmado: DocumentoFirmado) => {
    try {
        if (!session) {
            setError('No se pudo verificar la sesión del usuario');
            return;
        }

        // Obtener ubicación aproximada
        let ubicacion = 'Ubicación no disponible';
        try {
            const response = await fetch('https://ipapi.co/json/');
            const locationData = await response.json();
            ubicacion = `${locationData.city}, ${locationData.region}, ${locationData.country_name}`;
        } catch (geoError) {
            console.warn('No se pudo obtener la ubicación:', geoError);
        }

        // Determinar el tipo de firma basado en el rol del usuario
        const tipoFirma = session.user?.rol === 'solicitante' ? 'solicitante' : 'operador';

        // . NUEVA ESTRUCTURA PARA FIRMA ACUMULATIVA
        const firmaData = {
            nombreFirmante: session.user?.name || session.user?.email || 'Usuario',
            ubicacion: ubicacion,
            fechaFirma: new Date().toISOString(),
            tipoFirma: 'texto',
            firmaTexto: session.user?.name || 'Firma',
            ipFirmante: '', // Se completa en el backend
            userAgent: navigator.userAgent,
            hashDocumento: infoFirma?.hash_original
        };
        
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

        console.log('. Enviando firma acumulativa...', { tipoFirma, firma_id });

        // . USAR EL NUEVO ENDPOINT
        const response = await fetch(`${API_URL}/firmas/procesar-firma-word/${firma_id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessToken}`
            },
            body: JSON.stringify({
                firma_data: firmaData,
                tipo_firma: tipoFirma
            }),
        });

        const result = await response.json();
        console.log('. Resultado de firma acumulativa:', result);

        if (result.success) {
            setFirmaCompletada(true);
            setPasoActual(2);
            
            // . MOSTRAR MENSAJE SEGÚN INTEGRIDAD
            if (result.data.integridad_valida) {
                setError(''); // Limpiar errores
                // Mostrar mensaje de éxito completo
            } else {
                // Mostrar mensaje de éxito parcial
                setError('. Firma procesada exitosamente - Esperando contrafirma');
                setTimeout(() => setError(''), 5000);
            }
        } else {
            setError(result.message);
        }
    } catch (error) {
        console.error('. Error procesando firma:', error);
        setError('Error procesando firma');
    }
};
  const handleDescargarOriginal = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${API_URL}/firmas/documento-para-firma/${firma_id}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });      
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Convertir base64 a blob y descargar
          const binaryString = atob(result.data.documento);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: result.data.tipo });
          
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = infoFirma?.nombre_documento || 'contrato.docx';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    } catch (error) {
      console.error('Error descargando documento:', error);
      alert('Error al descargar el documento');
    }
  };
  
const handleDescargarContratoFirmado = async (firmaId: string) => {
    try {
        const session = await getSession();
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        const response = await fetch(`${API_URL}/firmas/ver-contrato-firmado/${firmaId}`, {
            headers: {
                'Authorization': `Bearer ${session?.accessToken}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } else {
            alert('Error al cargar el contrato firmado');
        }
    } catch (error) {
        console.error('Error viendo contrato firmado:', error);
        alert('Error de conexión');
    }
};


  if (sessionLoading || loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography align="center" sx={{ mt: 2 }}>
          {sessionLoading ? 'Verificando sesión...' : 'Cargando documento...'}
        </Typography>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Dialog open={true} onClose={() => router.push('/')}>
          <DialogTitle>Sesión Requerida</DialogTitle>
          <DialogContent>
            <Typography>
              Para acceder al proceso de firma digital, debe iniciar sesión.
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => router.push('/')}>
              Cancelar
            </Button>
            <Button onClick={handleLogin} variant="contained">
              Iniciar Sesión
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  if (error && !infoFirma) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
        <Button onClick={handleLogin} variant="contained">
          Ir al Login
        </Button>
      </Container>
    );
  }

  const pasos = [
    'Revisar Documento',
    'Firmar Documento', 
    'Firma Completada'
  ];

  const puedeFirmar = infoFirma?.firma?.estado !== 'firmado_completo';

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4, height: '90vh' }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Encabezado */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Firma Digital de Contrato
        </Typography>
        
        <Button
          variant="outlined"
          onClick={() => {
            // Redirigir según el rol del usuario
            const userRole = session?.user?.rol;
            if (userRole === 'operador') {
              router.push('/operador');
            } else if (userRole === 'solicitante') {
              router.push('/solicitante');
            } else {
              router.push('/');
            }
          }}
          sx={{ mb: 2 }}
        >
          Volver al Dashboard
        </Button>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <Chip 
            icon={<Description />} 
            label={`Solicitud: ${infoFirma?.firma?.solicitudes_credito?.numero_solicitud || 'N/A'}`}
            variant="outlined"
          />
          <Chip 
            icon={<Schedule />} 
            label={`Expira: ${infoFirma?.fecha_expiracion ? new Date(infoFirma.fecha_expiracion).toLocaleDateString() : 'No disponible'}`}
            color="warning"
            variant="outlined"
          />
          {infoFirma?.firma?.estado === 'firmado_completo' && (
            <Chip 
              icon={<CheckCircle />} 
              label="Completamente Firmado"
              color="success"
            />
          )}
          {!puedeFirmar && infoFirma?.firma?.estado !== 'firmado_completo' && (
            <Chip 
              label="Documento Ya Firmado"
              color="default"
            />
          )}
        </Box>

        <Stepper activeStep={pasoActual} sx={{ mb: 2 }}>
          {pasos.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Contenido según el paso */}
      {pasoActual === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Revisar Documento Antes de Firmar
            </Typography>
            <Typography paragraph>
              Por favor, revisa cuidadosamente el contrato antes de proceder con la firma digital.
              Una vez firmado, el documento tendrá validez legal.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => setPasoActual(1)}
                disabled={!infoFirma}
              >
                Continuar para Firmar
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDescargarOriginal}
                disabled={!infoFirma}
              >
                Descargar para Revisar
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {pasoActual === 1 && infoFirma && (
        <Box sx={{ height: 'calc(100vh - 200px)' }}>
          <VisorWordFirma
            documento={documento}
            onFirmaCompletada={handleFirmarDocumento}
            modoFirma={puedeFirmar}
            firmaId={firma_id as string} 
          />
          
          {!puedeFirmar && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Este documento ya ha sido firmado. Puedes descargar una copia firmada.
            </Alert>
          )}
        </Box>
      )}

      {pasoActual === 2 && (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                ¡Documento Firmado Exitosamente!
              </Typography>
              <Typography paragraph>
                Tu firma digital ha sido procesada y el documento tiene ahora validez legal.
                Se ha generado un hash único para garantizar la integridad del documento.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>

<Button
    variant="outlined"
    onClick={() => handleDescargarContratoFirmado(firma_id as string)}
>
    Descargar Contrato Firmado
</Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const userRole = session?.user?.rol;
                    if (userRole === 'operador') {
                      router.push('/operador');
                    } else if (userRole === 'solicitante') {
                      router.push('/solicitante');
                    } else {
                      router.push('/');
                    }
                  }}
                >
                  Volver al Dashboard
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default FirmaContratoPage;