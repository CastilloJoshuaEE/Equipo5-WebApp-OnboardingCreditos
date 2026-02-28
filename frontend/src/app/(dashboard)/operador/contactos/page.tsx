// frontend/src/app/(dashboard)/operador/contactos/page.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { getSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { 
  TextField, 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Box,
  Alert
} from '@mui/material';
import EditarContactoModal from '@/components/EditarContactoModal';
import { ContactoBancarioData } from '@/features/contacto_bancario/contactoBancario.types';

export default function ContactosBancariosPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const [contactos, setContactos] = useState<ContactoBancarioData[]>([]);
  const [contactosFiltrados, setContactosFiltrados] = useState<ContactoBancarioData[]>([]);
  const [busquedaCuenta, setBusquedaCuenta] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [contactoEditando, setContactoEditando] = useState<ContactoBancarioData | null>(null);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);

  const cargarContactos = useCallback(async () => {
    try {
      const session = await getSession();

      const response = await fetch(`${API_URL}/contactos-bancarios`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setContactos(data.data);
        setContactosFiltrados(data.data);
      } else {
        setError('No se pudieron cargar los contactos bancarios');
      }
    } catch {
      setError('Error al cargar los contactos bancarios');
    }
  }, [API_URL]);

  useEffect(() => {
    cargarContactos();
  }, [cargarContactos]);

  const buscarPorNumeroCuenta = () => {
    if (!busquedaCuenta.trim()) {
      setContactosFiltrados(contactos);
      return;
    }

    const filtrados = contactos.filter(c =>
      c.numero_cuenta.toLowerCase().includes(busquedaCuenta.toLowerCase())
    );

    setContactosFiltrados(filtrados);
  };

  const eliminarContacto = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este contacto?')) return;

    try {
      const session = await getSession();

      await fetch(`${API_URL}/contactos-bancarios/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      cargarContactos();
    } catch {
      setError('Error al eliminar contacto');
    }
  };

  return (
    <Box className="container mx-auto p-6 space-y-6">
      <Typography variant="h4">Gestión de Contactos Bancarios</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        <CardHeader title="Buscar por número de cuenta" />
        <CardContent className="flex gap-4">
          <TextField
            value={busquedaCuenta}
            onChange={(e) => setBusquedaCuenta(e.target.value)}
            placeholder="Número de cuenta"
            fullWidth
            size="small"
          />
          <Button onClick={buscarPorNumeroCuenta} variant="contained">
            Buscar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Contactos Registrados" />
        <CardContent className="space-y-4">
          {contactosFiltrados.map((contacto) => (
            <Box key={contacto.id} className="border rounded-lg p-4 flex justify-between">
              <Box>
                <Typography><strong>Cuenta:</strong> {contacto.numero_cuenta}</Typography>
                <Typography><strong>Banco:</strong> {contacto.nombre_banco}</Typography>
                <Typography><strong>Tipo:</strong> {contacto.tipo_cuenta}</Typography>
              </Box>

              <Box className="flex gap-2">
                <Button
                  variant="outlined"
                  onClick={() => {
                    setContactoEditando(contacto);
                    setModalEditarAbierto(true);
                  }}
                >
                  Editar
                </Button>

                <Button
                  variant="contained"
                  color="error"
                  onClick={() => eliminarContacto(contacto.id)}
                >
                  Eliminar
                </Button>
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>

      <Button
        variant="contained"
        onClick={() => window.location.href = '/operador/contactos/nuevo'}
      >
        Agregar Contacto
      </Button>

      <EditarContactoModal
        open={modalEditarAbierto}
        onClose={() => setModalEditarAbierto(false)}
        contacto={contactoEditando}
        onContactoActualizado={cargarContactos}
      />
    </Box>
  );
}