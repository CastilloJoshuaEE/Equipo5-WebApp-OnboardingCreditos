'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import { CloudUpload, Edit, Download } from '@mui/icons-material';

interface Plantilla {
  id: number;
  tipo: string;
  nombre_archivo: string;
  ruta_storage: string;
  tamanio_bytes: number;
  created_at: string;
}

export default function GestionPlantillas() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargarPlantillas();
  }, []);

  const cargarPlantillas = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/plantillas`);
      const json = await res.json();
      if (json.success) setPlantillas(json.data);
    } catch {
      setError('Error cargando plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubirPlantilla = async (file: File, tipo: string) => {
    try {
      const formData = new FormData();
      formData.append('archivo', file);
      formData.append('tipo', tipo);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/plantillas`, { method: 'POST', body: formData });

      if (!res.ok) throw new Error('Error subiendo plantilla');

      setSuccess('Plantilla subida exitosamente');
      await cargarPlantillas();
    } catch {
      setError('Error subiendo plantilla');
    }
  };

  const handleActualizarPlantilla = async (id: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append('archivo', file);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/plantillas/${id}`, { method: 'PUT', body: formData });

      if (!res.ok) throw new Error('Error actualizando plantilla');

      setSuccess('Plantilla actualizada exitosamente');
      await cargarPlantillas();
    } catch {
      setError('Error actualizando plantilla');
    }
  };

  const handleDescargar = (plantilla: Plantilla) => {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    window.open(`${baseUrl}/storage/v1/object/public/kyc-documents/${plantilla.ruta_storage}`, '_blank');
  };

  return (
    <Box>
    
      <Box my={2}>
        <input
          id="upload-plantilla"
          type="file"
          accept=".doc,.docx"
          onChange={(e) => e.target.files && handleSubirPlantilla(e.target.files[0], 'general')}
          style={{ display: 'none' }}
        />
        {/** 
        <label htmlFor="upload-plantilla">
          <Button variant="contained" component="span" startIcon={<CloudUpload />}>
            Subir nueva plantilla
          </Button>
        </label>
        */}
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Tamaño</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plantillas.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.nombre_archivo}</TableCell>
                <TableCell>{Math.round(p.tamanio_bytes / 1024)} KB</TableCell>
                <TableCell>
                  <Button startIcon={<Download />} onClick={() => handleDescargar(p)}>
                    Descargar
                  </Button>
                  {/**
                  <Button
                    startIcon={<Edit />}
                    component="label"
                  >
                    Actualizar
                    <input
                      type="file"
                      hidden
                      accept=".doc,.docx"
                      onChange={(e) => e.target.files && handleActualizarPlantilla(p.id, e.target.files[0])}
                    />
                  </Button>
                   */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success">{success}</Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError('')}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  );
}
