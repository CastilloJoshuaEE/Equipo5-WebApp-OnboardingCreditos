// frontend/src/app/(dashboard)/solicitudes/[id]/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Home,
  Description,
  ReceiptLong,
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import { DocumentosContrato } from '@/components/documentos/DocumentosContrato';
import { ComprobantesTransferencia } from '@/components/documentos/ComprobantesTransferencia';
import { TabPanelProps } from '@/components/ui/tab';


function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`documentos-tabpanel-${index}`}
      aria-labelledby={`documentos-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function DetalleSolicitudDocumentos() {
  const params = useParams();
  const { data: session } = useSession();
  const solicitudId = params?.id as string;
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar permisos y cargar datos iniciales
    const verificarPermisos = async () => {
      try {
        setLoading(true);
        // Aquí podrías agregar lógica adicional de verificación de permisos
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Error al cargar la solicitud');
        setLoading(false);
      }
    };

    verificarPermisos();
  }, [solicitudId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Inicio
        </Link>
        <Link
          underline="hover"
          color="inherit"
          href={session?.user.rol === 'operador' ? '/operador' : '/solicitante'}
        >
          {session?.user.rol === 'operador' ? 'Panel Operador' : 'Mis solicitudes'}
        </Link>
        <Typography color="text.primary">
          Documentos - Solicitud {solicitudId.slice(0, 8)}
        </Typography>
      </Breadcrumbs>

      {/* Título */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Documentos y Comprobantes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestiona y descarga los documentos de contrato y comprobantes de transferencia
          de la solicitud {solicitudId.slice(0, 8)}
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="documentos tabs">
          <Tab
            icon={<Description />}
            iconPosition="start"
            label="Contrato"
            id="documentos-tab-0"
            aria-controls="documentos-tabpanel-0"
          />
          <Tab
            icon={<ReceiptLong />}
            iconPosition="start"
            label="Comprobantes"
            id="documentos-tab-1"
            aria-controls="documentos-tabpanel-1"
          />
        </Tabs>
      </Box>

      {/* Contenido de las tabs */}
      <TabPanel value={tabValue} index={0}>
        <DocumentosContrato solicitudId={solicitudId} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ComprobantesTransferencia solicitudId={solicitudId} />
      </TabPanel>
    </Container>
  );
}