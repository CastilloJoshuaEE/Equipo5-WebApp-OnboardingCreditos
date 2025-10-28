'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField, Select, MenuItem, FormControl, InputLabel, Card, CardContent, CardHeader, Typography, Box } from '@mui/material';

export default function NuevoContactoPage() {
  const [formData, setFormData] = useState({
    dni: '',
    numero_cuenta: '',
    tipo_cuenta: 'ahorros',
    moneda: 'USD',
    email_contacto: '',
    telefono_contacto: ''
  });
  const [solicitanteInfo, setSolicitanteInfo] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);

  const buscarSolicitante = async () => {
    if (!formData.dni) return;

    setBuscando(true);
    try {
      const response = await fetch(`/api/contactos-bancarios/buscar?dni=${formData.dni}`);
      const data = await response.json();
      
      if (data.success) {
        setSolicitanteInfo(data.data.solicitante);
        // Mostrar mensaje de éxito
        alert(`Solicitante encontrado: ${data.data.solicitante.nombre_completo}`);
      } else {
        setSolicitanteInfo(null);
        alert('No se encontró solicitante con ese DNI');
      }
    } catch (error) {
      alert('Error al buscar solicitante');
    } finally {
      setBuscando(false);
    }
  };

  const guardarContacto = async () => {
    if (!solicitanteInfo || !formData.numero_cuenta) {
      alert('Complete todos los campos requeridos');
      return;
    }

    // Validar email si se proporciona
    if (formData.email_contacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_contacto)) {
      alert('Formato de email inválido');
      return;
    }

    try {
      const response = await fetch('/api/contactos-bancarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          solicitante_id: solicitanteInfo.id,
          numero_cuenta: formData.numero_cuenta,
          tipo_cuenta: formData.tipo_cuenta,
          moneda: formData.moneda,
          email_contacto: formData.email_contacto,
          telefono_contacto: formData.telefono_contacto
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Contacto guardado exitosamente');
        // Redirigir a la página de transferencia
        window.location.href = '/operador/transferencias/nueva';
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      alert('No se pudo guardar el contacto');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Typography variant="h4" component="h1" gutterBottom>
        NUEVO CONTACTO
      </Typography>
      
      <Card>
        <CardHeader title="BUSCAR SOLICITANTE POR DNI" />
        <CardContent>
          <Box className="space-y-4">
            <Box className="flex gap-2">
              <TextField
                placeholder="Ingrese DNI del solicitante"
                value={formData.dni}
                onChange={(e) => setFormData({...formData, dni: e.target.value})}
                fullWidth
                size="small"
              />
              <Button 
                onClick={buscarSolicitante} 
                disabled={buscando}
                variant="contained"
              >
                {buscando ? 'Buscando...' : 'Buscar'}
              </Button>
            </Box>
            
            {solicitanteInfo && (
              <Box className="bg-green-50 border border-green-200 rounded p-4">
                <Typography variant="h6" className="font-semibold text-green-800">
                  Solicitante Encontrado
                </Typography>
                <Typography>Nombre: {solicitanteInfo.nombre_completo}</Typography>
                <Typography>Email: {solicitanteInfo.email}</Typography>
                <Typography>DNI: {solicitanteInfo.dni}</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {solicitanteInfo && (
        <Card>
          <CardHeader title="INFORMACIÓN DE LA CUENTA" />
          <CardContent>
            <Box className="space-y-4">
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  NRO. DE CUENTA *
                </Typography>
                <TextField
                  placeholder="Número de cuenta bancaria"
                  value={formData.numero_cuenta}
                  onChange={(e) => setFormData({...formData, numero_cuenta: e.target.value})}
                  fullWidth
                  size="small"
                />
                <Typography variant="caption" className="text-gray-500">
                  VALIDAR CUENTA (POR DEFECTO SE ACEPTAN TODAS)
                </Typography>
              </Box>
              
              <Box className="grid grid-cols-2 gap-4">
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Cuenta</InputLabel>
                  <Select
                    value={formData.tipo_cuenta}
                    onChange={(e) => setFormData({...formData, tipo_cuenta: e.target.value})}
                    label="Tipo de Cuenta"
                  >
                    <MenuItem value="ahorros">Ahorros</MenuItem>
                    <MenuItem value="corriente">Corriente</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Moneda</InputLabel>
                  <Select
                    value={formData.moneda}
                    onChange={(e) => setFormData({...formData, moneda: e.target.value})}
                    label="Moneda"
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="ARS">ARS</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {solicitanteInfo && (
        <Card>
          <CardHeader title="INFORMACIÓN PERSONAL (Opcional)" />
          <CardContent>
            <Box className="space-y-4">
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Correo electrónico de solicitante
                </Typography>
                <TextField
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={formData.email_contacto}
                  onChange={(e) => setFormData({...formData, email_contacto: e.target.value})}
                  fullWidth
                  size="small"
                />
              </Box>
              
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Teléfono de contacto
                </Typography>
                <TextField
                  placeholder="+1 234 567 8900"
                  value={formData.telefono_contacto}
                  onChange={(e) => setFormData({...formData, telefono_contacto: e.target.value})}
                  fullWidth
                  size="small"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {solicitanteInfo && (
        <Box className="text-center">
          <Button 
            onClick={guardarContacto} 
            variant="contained" 
            className="bg-blue-600 hover:bg-blue-700"
          >
            GUARDAR CONTACTO
          </Button>
        </Box>
      )}
    </div>
  );
}