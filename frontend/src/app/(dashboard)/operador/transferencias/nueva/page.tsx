'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TextField, Card, CardContent, CardHeader, Typography, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Modal } from '@/components/ui/modal';
interface ContactoBancario {
  id: string;
  numero_cuenta: string;
  nombre_banco: string;
  tipo_cuenta: string;
  moneda: string;
  solicitante_nombre: string;
  solicitante_dni: string;
}

interface SolicitudInfo {
  id: string;
  numero_solicitud: string;
  monto: number;
  moneda: string;
}

export default function NuevaTransferenciaPage() {
  const searchParams = useSearchParams();
  const solicitudId = searchParams?.get('solicitud_id') || '';
  const [step, setStep] = useState(1);
  const [contactos, setContactos] = useState<ContactoBancario[]>([]);
  const [contactosFiltrados, setContactosFiltrados] = useState<ContactoBancario[]>([]);
  const [solicitudInfo, setSolicitudInfo] = useState<SolicitudInfo | null>(null);
  const [contactoSeleccionado, setContactoSeleccionado] = useState<ContactoBancario | null>(null);
  const [busquedaDNI, setBusquedaDNI] = useState('');
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');

  // Cargar información de la solicitud
  useEffect(() => {
    if (solicitudId) {
      cargarSolicitudInfo();
      cargarContactos();
    }
  }, [solicitudId]);

  const cargarSolicitudInfo = async () => {
    try {
      const response = await fetch(`/api/solicitudes/${solicitudId}`);
      const data = await response.json();
      
      if (data.success) {
        setSolicitudInfo(data.data);
        setMonto(data.data.monto.toString());
      }
    } catch (error) {
      alert('No se pudo cargar la información de la solicitud');
    }
  };

  const cargarContactos = async () => {
    try {
      const response = await fetch('/api/contactos-bancarios/mis-contactos');
      const data = await response.json();
      
      if (data.success) {
        setContactos(data.data);
        setContactosFiltrados(data.data);
      }
    } catch (error) {
      alert('No se pudieron cargar los contactos');
    }
  };

  const buscarPorDNI = async () => {
    if (!busquedaDNI) {
      setContactosFiltrados(contactos);
      return;
    }

    try {
      const response = await fetch(`/api/contactos-bancarios/buscar?dni=${busquedaDNI}`);
      const data = await response.json();
      
      if (data.success) {
        setContactosFiltrados(data.data.contactos.map((contacto: any) => ({
          ...contacto,
          solicitante_nombre: data.data.solicitante.nombre_completo,
          solicitante_dni: data.data.solicitante.dni
        })));
      } else {
        alert('No se encontraron contactos con ese DNI');
      }
    } catch (error) {
      alert('Error al buscar contactos');
    }
  };

  const seleccionarContacto = (contacto: ContactoBancario) => {
    setContactoSeleccionado(contacto);
    setStep(2);
  };

  const confirmarTransferencia = async () => {
    if (!solicitudId || !contactoSeleccionado || !monto) return;

    try {
      const response = await fetch('/api/transferencias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          solicitud_id: solicitudId,
          contacto_bancario_id: contactoSeleccionado.id,
          monto: parseFloat(monto),
          moneda: solicitudInfo?.moneda || 'USD',
          motivo
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Transferencia creada exitosamente');
        // Redirigir al dashboard
        window.location.href = '/operador';
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      alert('No se pudo crear la transferencia');
    }
  };

  if (step === 1) {
    return (
      <Box className="container mx-auto p-6 space-y-6">
        <Typography variant="h4" component="h1" gutterBottom>
          Simulación de Transferencia - Banco Pichincha
        </Typography>
        
        <Card>
          <CardHeader title="BUSCAR CONTACTO DE SOLICITANTE POR DNI" />
          <CardContent>
            <Box className="space-y-4">
              <Box className="flex gap-2">
                <TextField
                  placeholder="Ingrese DNI del solicitante"
                  value={busquedaDNI}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusquedaDNI(e.target.value)}
                  fullWidth
                  size="small"
                />
                <Button onClick={buscarPorDNI} variant="contained">
                  Buscar
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="MIS CONTACTOS (SOLICITANTES REGISTRADOS)" />
          <CardContent>
            <Box className="space-y-4">
              {contactosFiltrados.map((contacto) => (
                <Box key={contacto.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                  <Box className="flex justify-between items-center">
                    <Box>
                      <Typography variant="h6" className="font-semibold">{contacto.solicitante_nombre}</Typography>
                      <Typography>DNI: {contacto.solicitante_dni}</Typography>
                      <Typography>Cuenta: {contacto.numero_cuenta} - {contacto.nombre_banco}</Typography>
                      <Typography>Tipo: {contacto.tipo_cuenta} - {contacto.moneda}</Typography>
                    </Box>
                    <Button 
                      onClick={() => seleccionarContacto(contacto)}
                      variant="contained"
                    >
                      Seleccionar
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
            onClick={() => window.location.href = '/operador/contactos/nuevo'}
            variant="outlined"
          >
            AGREGAR CONTACTO NUEVO
          </Button>
        </Box>
      </Box>
    );
  }

  if (step === 2 && contactoSeleccionado && solicitudInfo) {
    return (
      <Box className="container mx-auto p-6 space-y-6">
        <Typography variant="h4" component="h1" gutterBottom>
          Confirmar Transferencia
        </Typography>
        
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMonto(e.target.value)}
                    placeholder="Ingrese el monto"
                    fullWidth
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Motivo (Opcional)
                  </Typography>
                  <TextField
                    value={motivo}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMotivo(e.target.value)}
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
                <Typography><strong>Nombre:</strong> {contactoSeleccionado.solicitante_nombre}</Typography>
                <Typography><strong>Número de Cuenta:</strong> {contactoSeleccionado.numero_cuenta}</Typography>
                <Typography><strong>Banco:</strong> {contactoSeleccionado.nombre_banco}</Typography>
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
          >
            CONTINUAR
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
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmarTransferencia}
                variant="contained"
              >
                Sí, Confirmar Transferencia
              </Button>
            </>
          }
        >
          <Typography>¿Está seguro de realizar esta transferencia?</Typography>
          <Typography><strong>Monto:</strong> {solicitudInfo.moneda} {monto}</Typography>
          <Typography><strong>Destinatario:</strong> {contactoSeleccionado.solicitante_nombre}</Typography>
          <Typography><strong>Cuenta:</strong> {contactoSeleccionado.numero_cuenta}</Typography>
        </Modal>
      </Box>
    );
  }

  return <div>Cargando...</div>;
}