// frontend/src/app/(dashboard)/operador/transferencias/nueva/page.tsx - VERSIÓN CORREGIDA

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  TextField, 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { Modal } from '@/components/ui/modal';
import { getSession } from 'next-auth/react';
import EditarContactoModal from '@/components/EditarContactoModal';
interface ContactoBancario {
  id: string;
  numero_cuenta: string;
  nombre_banco: string;
  tipo_cuenta: string;
  moneda: string;
  email_contacto?: string;
  telefono_contacto?: string;
  solicitante_id?: string;
}

interface SolicitudInfo {
  id: string;
  numero_solicitud: string;
  monto: number;
  moneda: string;
  solicitante_id: string;
  estado: string;
}

interface VerificacionFirma {
  habilitado: boolean;
  motivo: string;
  estado_firma: string;
  detalles?: any;
}

export default function NuevaTransferenciaPage() {
  const searchParams = useSearchParams();
  const solicitudId = searchParams?.get('solicitud_id') || '';
  
  const [step, setStep] = useState(1);
  const [contactos, setContactos] = useState<ContactoBancario[]>([]);
  const [contactosFiltrados, setContactosFiltrados] = useState<ContactoBancario[]>([]);
  const [solicitudInfo, setSolicitudInfo] = useState<SolicitudInfo | null>(null);
  const [contactoSeleccionado, setContactoSeleccionado] = useState<ContactoBancario | null>(null);
  const [busquedaCuenta, setBusquedaCuenta] = useState('');
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificandoFirma, setVerificandoFirma] = useState(false);
  const [verificacionFirma, setVerificacionFirma] = useState<VerificacionFirma | null>(null);
const [contactoEditando, setContactoEditando] = useState<ContactoBancario | null>(null);
const [modalEditarAbierto, setModalEditarAbierto] = useState(false);

const handleEditarContacto = (contacto: ContactoBancario) => {
  setContactoEditando(contacto);
  setModalEditarAbierto(true);
};
  // Cargar información de la solicitud y contactos
  useEffect(() => {
    if (solicitudId) {
      cargarSolicitudInfo();
      cargarContactos();
      verificarEstadoFirma();
    }
  }, [solicitudId]);

  const cargarSolicitudInfo = async () => {
    try {
      const session = await getSession();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${API_URL}/solicitudes/${solicitudId}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSolicitudInfo(data.data);
        setMonto(data.data.monto.toString());
      } else {
        setError('No se pudo cargar la información de la solicitud');
      }
    } catch (error) {
      setError('Error al cargar la información de la solicitud');
    }
  };

  const cargarContactos = async () => {
    try {
      const session = await getSession();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${API_URL}/contactos-bancarios`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setContactos(data.data);
        setContactosFiltrados(data.data);
      } else {
        setError('No se pudieron cargar los contactos bancarios');
      }
    } catch (error) {
      setError('Error al cargar los contactos bancarios');
    }
  };

  const verificarEstadoFirma = async () => {
    if (!solicitudId) return;
    
    setVerificandoFirma(true);
    try {
      const session = await getSession();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${API_URL}/transferencias/habilitacion/${solicitudId}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setVerificacionFirma(data.data);
        
        if (!data.data.habilitado) {
          setError(`No se puede realizar la transferencia: ${data.data.motivo}`);
        }
      }
    } catch (error) {
      console.error('Error verificando estado de firma:', error);
    } finally {
      setVerificandoFirma(false);
    }
  };

  const forzarVerificacionFirma = async () => {
    if (!solicitudId) return;
    
    setVerificandoFirma(true);
    try {
      const session = await getSession();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${API_URL}/transferencias/forzar-actualizacion/${solicitudId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setVerificacionFirma(data.data);
        
        if (data.data.habilitado) {
          setError(null);
          alert('¡Verificación exitosa! Ya puedes proceder con la transferencia.');
        } else {
          setError(`Aún no se puede realizar la transferencia: ${data.data.motivo}`);
        }
      } else {
        setError('Error al forzar verificación: ' + data.message);
      }
    } catch (error) {
      setError('Error al forzar verificación de firma');
    } finally {
      setVerificandoFirma(false);
    }
  };

  const buscarPorNumeroCuenta = () => {
    if (!busquedaCuenta.trim()) {
      setContactosFiltrados(contactos);
      return;
    }

    const filtrados = contactos.filter(contacto =>
      contacto.numero_cuenta.toLowerCase().includes(busquedaCuenta.toLowerCase())
    );
    
    setContactosFiltrados(filtrados);
  };

  const seleccionarContacto = (contacto: ContactoBancario) => {
    // Verificar que el contacto pertenezca al solicitante de la solicitud
    if (solicitudInfo && contacto.solicitante_id !== solicitudInfo.solicitante_id) {
      setError('El contacto bancario seleccionado no pertenece al solicitante de esta solicitud');
      return;
    }
    
    setContactoSeleccionado(contacto);
    setStep(2);
  };
const confirmarTransferencia = async () => {
    if (!solicitudId || !contactoSeleccionado || !monto) {
        setError('Faltan datos requeridos para la transferencia');
        return;
    }

    // Verificar nuevamente el estado de la firma antes de proceder
    if (!verificacionFirma?.habilitado) {
        setError('No se puede proceder con la transferencia. La firma digital no está completada.');
        return;
    }

    setLoading(true);
    setError(null);

    try {
        const session = await getSession();
        if (!session?.accessToken) {
            throw new Error('No se pudo obtener la sesión del usuario');
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        const transferenciaData = {
            solicitud_id: solicitudId,
            contacto_bancario_id: contactoSeleccionado.id,
            monto: parseFloat(monto),
            moneda: solicitudInfo?.moneda || 'USD',
            motivo: motivo || 'Transferencia de crédito aprobado'
        };

        console.log('Enviando datos de transferencia:', transferenciaData);

        const response = await fetch(`${API_URL}/transferencias`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessToken}`
            },
            body: JSON.stringify(transferenciaData),
        });

        const data = await response.json();

        if (!response.ok) {
            // Intentar obtener mensaje de error más específico
            const errorMessage = data.message || data.error || `Error ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
        }

        if (data.success) {
            alert('. Transferencia creada exitosamente');
            window.location.href = '/operador';
        } else {
            throw new Error(data.message || 'Error desconocido al crear transferencia');
        }
    } catch (error: any) {
        console.error('. Error creando transferencia:', error);
        setError(`No se pudo crear la transferencia: ${error.message}`);
    } finally {
        setLoading(false);
        setMostrarModalConfirmacion(false);
    }
};

  // Paso 1: Selección de contacto
  if (step === 1) {
    return (
      <Box className="container mx-auto p-6 space-y-6">
        <Typography variant="h4" component="h1" gutterBottom>
          Transferencia - Nexia
        </Typography>

        {/* Verificación de Firma Digital */}
        {verificacionFirma && (
          <Card className={verificacionFirma.habilitado ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}>
            <CardContent>
              <Box className="flex justify-between items-center">
                <Box>
                  <Typography variant="h6">
                    Estado de Firma Digital: {verificacionFirma.habilitado ? '. COMPLETADA' : '. PENDIENTE'}
                  </Typography>
                  <Typography color="textSecondary">
                    {verificacionFirma.motivo}
                  </Typography>
                  {verificacionFirma.estado_firma && (
                    <Typography variant="body2">
                      Estado actual: {verificacionFirma.estado_firma}
                    </Typography>
                  )}
                </Box>
                {!verificacionFirma.habilitado && (
                  <Button 
                    onClick={forzarVerificacionFirma}
                    variant="contained"
                    disabled={verificandoFirma}
                    startIcon={verificandoFirma ? <CircularProgress size={20} /> : null}
                  >
                    {verificandoFirma ? 'Verificando...' : 'Forzar Verificación'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <CardHeader title="BUSCAR CONTACTO POR NÚMERO DE CUENTA" />
          <CardContent>
            <Box className="flex gap-4 mb-4">
              <TextField
                placeholder="Buscar por número de cuenta..."
                value={busquedaCuenta}
                onChange={(e) => setBusquedaCuenta(e.target.value)}
                fullWidth
                size="small"
              />
              <Button 
                onClick={buscarPorNumeroCuenta}
                variant="contained"
              >
                Buscar
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="CONTACTOS BANCARIOS DISPONIBLES" />
          <CardContent>
            <Box className="space-y-4">
              {contactosFiltrados.map((contacto) => (
                <Box 
                  key={contacto.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <Box className="flex justify-between items-center">
                    <Box>
                      <Typography variant="h6" className="font-semibold">
                        Cuenta: {contacto.numero_cuenta}
                      </Typography>
                      <Typography>Banco: {contacto.nombre_banco}</Typography>
                      <Typography>Tipo: {contacto.tipo_cuenta} - {contacto.moneda}</Typography>
                      {contacto.email_contacto && (
                        <Typography>Email: {contacto.email_contacto}</Typography>
                      )}
                      {contacto.telefono_contacto && (
                        <Typography>Teléfono: {contacto.telefono_contacto}</Typography>
                      )}
                    </Box>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        seleccionarContacto(contacto);
                      }}
                      variant="contained"
                    >
                      Seleccionar
                    </Button>
                    <Button 
  onClick={() => handleEditarContacto(contacto)}
  variant="outlined"
  color="primary"
>
  Editar
</Button>
                  </Box>
                </Box>
              ))}
              
              {contactosFiltrados.length === 0 && (
                <Typography className="text-center text-gray-500">
                  No se encontraron contactos
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>

        <Box className="text-center">
          <Button 
            onClick={() => window.location.href = `/operador/contactos/nuevo?solicitud_id=${solicitudId}`}
            variant="outlined"
          >
            AGREGAR/EDITAR/ELIMINAR CONTACTO
          </Button>
                  <Button 
          variant="outlined" 
          onClick={() => window.location.href = `/operador`}
          sx={{ mt: 2 }}
        >
          Volver al Dashboard
        </Button>
        </Box>
        <EditarContactoModal
  open={modalEditarAbierto}
  onClose={() => {
    setModalEditarAbierto(false);
    setContactoEditando(null);
  }}
  contacto={contactoEditando}
  onContactoActualizado={() => {
    // Recargar contactos después de editar
    cargarContactos();
  }}
/>
      </Box>
    );
  }

  // Paso 2: Confirmación de transferencia
  if (step === 2 && contactoSeleccionado && solicitudInfo) {
    return (
      <Box className="container mx-auto p-6 space-y-6">
        <Typography variant="h4" component="h1" gutterBottom>
          Confirmar Transferencia
        </Typography>
        
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Verificación de Firma en Paso 2 */}
        {verificacionFirma && !verificacionFirma.habilitado && (
          <Alert severity="warning">
            <Typography variant="h6">Advertencia: Firma Digital Incompleta</Typography>
            <Typography>{verificacionFirma.motivo}</Typography>
            <Button 
              onClick={forzarVerificacionFirma}
              variant="outlined"
              size="small"
              className="mt-2"
              disabled={verificandoFirma}
            >
              {verificandoFirma ? 'Verificando...' : 'Reintentar Verificación'}
            </Button>
          </Alert>
        )}

        <Card>
          <CardHeader title="MONTO A TRANSFERIR" />
          <CardContent>
            <Box className="space-y-4">
              <Box className="grid grid-cols-2 gap-4">
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Monto ({solicitudInfo.moneda})
                  </Typography>
                  <TextField
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="Ingrese el monto"
                    fullWidth
                    size="small"
                    error={!monto || parseFloat(monto) <= 0}
                    helperText={!monto || parseFloat(monto) <= 0 ? "Monto debe ser mayor a 0" : ""}
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Motivo (Opcional)
                  </Typography>
                  <TextField
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Motivo de la transferencia"
                    fullWidth
                    size="small"
                  />
                </Box>
              </Box>
              
              <Box className="border-t pt-4">
                <Typography variant="h6" gutterBottom>
                  Información del Destinatario
                </Typography>
                <Typography><strong>Número de Cuenta:</strong> {contactoSeleccionado.numero_cuenta}</Typography>
                <Typography><strong>Banco:</strong> {contactoSeleccionado.nombre_banco}</Typography>
                <Typography><strong>Tipo:</strong> {contactoSeleccionado.tipo_cuenta}</Typography>
                <Typography><strong>Moneda:</strong> {contactoSeleccionado.moneda}</Typography>
              </Box>
              
              <Box className="border-t pt-4">
                <Typography variant="h6" gutterBottom>
                  Información del Origen
                </Typography>
                <Typography><strong>Cuenta Origen:</strong> NEXIA-001-USD</Typography>
                <Typography><strong>Banco Origen:</strong> Nexia Bank</Typography>
                <Typography className="text-green-600 font-semibold">
                  ESTA TRANSFERENCIA NO TIENE COSTO
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box className="flex justify-center gap-4">
          <Button variant="outlined" onClick={() => setStep(1)}>
            Volver
          </Button>
          <Button 
            onClick={() => setMostrarModalConfirmacion(true)}
            variant="contained"
            disabled={loading || !verificacionFirma?.habilitado || !monto || parseFloat(monto) <= 0}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'PROCESANDO...' : 'CONTINUAR'}
          </Button>
        </Box>

        <Modal
          open={mostrarModalConfirmacion}
          onClose={() => setMostrarModalConfirmacion(false)}
          title="Confirmar Transferencia"
          actions={
            <>
              <Button 
                variant="outlined" 
                onClick={() => setMostrarModalConfirmacion(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmarTransferencia}
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'PROCESANDO...' : 'Sí, Confirmar Transferencia'}
              </Button>
            </>
          }
        >
          <Typography variant="h6" gutterBottom>¿Está seguro de realizar esta transferencia? Recuerde una vez aceptado el proceso de solicitud de crédito se cierra</Typography>
          <Box className="space-y-2">
            <Typography><strong>Monto:</strong> {solicitudInfo.moneda} {monto}</Typography>
            <Typography><strong>Destinatario:</strong> {contactoSeleccionado.numero_cuenta}</Typography>
            <Typography><strong>Banco:</strong> {contactoSeleccionado.nombre_banco}</Typography>
            <Typography><strong>Estado Firma Digital:</strong> {verificacionFirma?.habilitado ? '. COMPLETADA' : '. INCOMPLETA'}</Typography>
          </Box>
        </Modal>
      </Box>
    );
  }

  return (
    <Box className="container mx-auto p-6 text-center">
      <CircularProgress />
      <Typography className="mt-4">Cargando...</Typography>
    </Box>
  );
}