// frontend/src/components/solicitudes/SolicitudCreditoForm.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { getSession, useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Backdrop,
  CircularProgress
} from '@mui/material';
import { Delete, CloudUpload, Description } from '@mui/icons-material';
import { solicitudCreditoSchema, type SolicitudCreditoInput } from '@/schemas/solicitud.schema';
const steps = ['Datos del Crédito', 'Documentación', 'Revisión'];
interface DocumentoConTipo {
  file: File;
  tipo: string;
  id: string; // ID único para identificar el documento
}


type FormData = {
  monto: number;
  plazo_meses: number;
  moneda: 'ARS' | 'USD';
  proposito: string;
};
interface SolicitudCreditoFormProps {
  onSuccess: () => void;
}
export default function SolicitudCreditoForm({ onSuccess }: SolicitudCreditoFormProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [documentos, setDocumentos] = useState<DocumentoConTipo[]>([]);
  const [solicitudId, setSolicitudId] = useState<string | null>(null);
  const { data: session } = useSession();
  const [loadingOverlay, setLoadingOverlay] = useState(false); // 🟢 NUEVO

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue
  } = useForm<FormData>({
    resolver: zodResolver(solicitudCreditoSchema) as any,
    defaultValues: {
      moneda: 'ARS',
      monto: undefined as any,
      plazo_meses: undefined as any,
      proposito: ''
    }
  });

  const monto = watch('monto');
  const plazoMeses = watch('plazo_meses');

  // Guardar datos en localStorage
  const guardarBorrador = useCallback(() => {

    if (!session?.user?.id) return;
    const formData = {
      userId: session.user.id,
      monto: watch('monto'),
      plazo_meses: watch('plazo_meses'),
      moneda: watch('moneda'),
      proposito: watch('proposito'),
documentos: documentos.map(doc => ({
  name: doc.file.name,
  size: doc.file.size,
  type: doc.file.type,
  lastModified: doc.file.lastModified
})),

      ultimaActualizacion: new Date().toISOString()
    };
    
    localStorage.setItem(`solicitud_borrador_${session.user.id}`, JSON.stringify(formData));
    console.log('Borrador guardado en localStorage');
  }, [watch, documentos, session]);

  // Usar debounce para guardar automáticamente
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (activeStep === 0) { // Solo guardar en paso de datos
        guardarBorrador();
      }
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [watch('monto'), watch('plazo_meses'), watch('moneda'), watch('proposito'), guardarBorrador, activeStep]);

  // Cargar borrador al montar el componente
  useEffect(() => {
    if (!session?.user?.id) return;
    const borradorGuardado = localStorage.getItem(`solicitud_borrador_${session.user.id}`);    if (borradorGuardado) {
      try {
        const data = JSON.parse(borradorGuardado);
        if (data.userId !== session.user.id) {
          localStorage.removeItem(`solicitud_borrador_${session.user.id}`);
          return;
        }
        // Verificar si el borrador es reciente (menos de 24 horas)
        const fechaBorrador = new Date(data.ultimaActualizacion);
        const ahora = new Date();
        const diferenciaHoras = (ahora.getTime() - fechaBorrador.getTime()) / (1000 * 60 * 60);
        
        if (diferenciaHoras < 24) {
          setValue('monto', data.monto || '');
          setValue('plazo_meses', data.plazo_meses || '');
          setValue('moneda', data.moneda || 'ARS');
          setValue('proposito', data.proposito || '');
          
          console.log('Borrador cargado desde localStorage');
        } else {
          // Borrar borrador viejo
          localStorage.removeItem(`solicitud_borrador_${session.user.id}`);
        }
      } catch (error) {
        console.error('Error cargando borrador:', error);
        localStorage.removeItem(`solicitud_borrador_${session.user.id}`);
      }
    }
  }, [setValue, session]);
  // Función para eliminar documento
  const eliminarDocumento = (documentoId: string) => {
    setDocumentos(prev => prev.filter(doc => doc.id !== documentoId));
    console.log('Documento eliminado:', documentoId);
  };
   // Función para manejar la selección de archivos con tipo específico
  const handleDocumentoChange = (event: React.ChangeEvent<HTMLInputElement>, tipo: string) => {
    const files = event.target.files;
    if (files && files[0]) {
      const nuevoDocumento: DocumentoConTipo = {
        file: files[0],
        tipo: tipo,
        id: `${tipo}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` // ID único
      };
      
      // Verificar si ya existe un documento del mismo tipo
      const existeMismoTipo = documentos.some(doc => doc.tipo === tipo);
      
      if (existeMismoTipo) {
        if (confirm(`Ya existe un documento de tipo ${obtenerNombreTipo(tipo)}. ¿Desea reemplazarlo?`)) {
          // Reemplazar el documento existente del mismo tipo
          setDocumentos(prev => prev.filter(doc => doc.tipo !== tipo).concat([nuevoDocumento]));
        }
      } else {
        // Agregar nuevo documento
        setDocumentos(prev => [...prev, nuevoDocumento]);
      }
      
      // Limpiar el input file
      event.target.value = '';
    }
  };
    const obtenerNombreTipo = (tipo: string): string => {
    const tipos: { [key: string]: string } = {
      'dni': 'DNI',
      'cuit': 'CUIT',
      'comprobante_domicilio': 'Comprobante de Domicilio',
      'balance_contable': 'Balance Contable',
      'declaracion_impuestos': 'Declaración de Impuestos'
    };
    return tipos[tipo] || tipo;
  };
   const formatearTamaño = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const limpiarFormulario = () => {
    if (session?.user?.id) {
      localStorage.removeItem(`solicitud_borrador_${session.user.id}`);
    }    
    // Resetear formulario
    setValue('monto', 0);
    setValue('plazo_meses', 0);
    setValue('moneda', 'ARS');
    setValue('proposito', '');
    setDocumentos([]);
    setSolicitudId(null);
    setActiveStep(0);
    setError('');
    setSuccess('');
    
    // Limpiar localStorage
    localStorage.removeItem('solicitud_borrador');
    console.log('Formulario limpiado para usuario:', session?.user?.id);
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };
 // ALTERNATIVA: Usar primary y secondary por separado
// CORREGIR: Función renderListaDocumentos
const renderListaDocumentos = () => (
  <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle1" gutterBottom>
      Documentos Subidos ({documentos.length})
    </Typography>
    {documentos.length === 0 ? (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        No hay documentos subidos
      </Typography>
    ) : (
      <List dense sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        {documentos.map((documento) => (
          <ListItem key={documento.id} divider>
            <Description sx={{ mr: 1, color: 'primary.main' }} />
            <ListItemText
              primary={documento.file.name}
              secondary={
                // CORRECCIÓN: Usar Fragment en lugar de Box
                <React.Fragment>
                  <Typography variant="caption" display="block">
                    Tipo: {obtenerNombreTipo(documento.tipo)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tamaño: {formatearTamaño(documento.file.size)}
                  </Typography>
                </React.Fragment>
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="eliminar"
                onClick={() => eliminarDocumento(documento.id)}
                color="error"
                size="small"
              >
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    )}
  </Box>
);
  const onSubmit = async (data: SolicitudCreditoInput) => {
    try {
      setError('');
      setSuccess('');
 setLoadingOverlay(true); 
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const session = await getSession();

      if (!session?.accessToken) throw new Error('No estás autenticado');

      let nuevaSolicitudId = solicitudId;

      // Si no existe solicitud aún, crearla
      if (!nuevaSolicitudId) {
        const solicitudResponse = await fetch(`${API_URL}/solicitudes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`
          },
          body: JSON.stringify(data)
        });
        if (!solicitudResponse.ok) throw new Error('Error al crear la solicitud');

        const solicitudResult = await solicitudResponse.json();
        nuevaSolicitudId = solicitudResult.data.id;
        setSolicitudId(nuevaSolicitudId);
      }

      // Subir documentos
      for (const documento of documentos) {
        const formData = new FormData();
        if (!nuevaSolicitudId) throw new Error('ID de solicitud inválido');
formData.append('archivo', documento.file);
        formData.append('solicitud_id', nuevaSolicitudId);
formData.append('tipo', obtenerTipoDocumento(documento.file.name));

        const documentoResponse = await fetch(`${API_URL}/solicitudes/${nuevaSolicitudId}/documentos`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${session.accessToken}`
          }
        });

        if (!documentoResponse.ok) {
          console.error('Error subiendo documento:', documento.file.name);
        }
      }

      // Enviar solicitud
      const enviarResponse = await fetch(`${API_URL}/solicitudes/${nuevaSolicitudId}/enviar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        }
      });
      if (!enviarResponse.ok) throw new Error('Error al enviar la solicitud');

      setSuccess('Solicitud de crédito enviada exitosamente');
      setActiveStep(3);
      localStorage.removeItem('solicitud_borrador'); // Limpiar borrador
    } catch (error) {
      console.error('Error en solicitud:', error);
      setError(error instanceof Error ? error.message : 'Error al procesar la solicitud');
    }
    finally {
      setLoadingOverlay(false); // 🟢 Ocultar overlay al finalizar
    }
  };

  const obtenerTipoDocumento = (nombreArchivo: string): string => {
    if (nombreArchivo.includes('dni')) return 'dni';
    if (nombreArchivo.includes('cuit')) return 'cuit';
    if (nombreArchivo.includes('domicilio')) return 'comprobante_domicilio';
    if (nombreArchivo.includes('balance')) return 'balance_contable';
    if (nombreArchivo.includes('financiero')) return 'estado_financiero';
    if (nombreArchivo.includes('impuestos')) return 'declaracion_impuestos';
    return 'otros';
  };
  // Renderizar los controles de subida de documentos
  const renderControlesDocumentos = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom>
          Documentación Obligatoria
        </Typography>
      </Grid>

      {/* DNI */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              DNI - Documento Nacional de Identidad
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
              color={documentos.some(d => d.tipo === 'dni') ? "success" : "primary"}
            >
              {documentos.some(d => d.tipo === 'dni') ? 'DNI Subido' : 'Subir DNI'}
              <input
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleDocumentoChange(e, 'dni')}
              />
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Formatos: PDF (Máx. 5MB)
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* CUIT */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              CUIT - Constancia de Inscripción
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
              color={documentos.some(d => d.tipo === 'cuit') ? "success" : "primary"}
            >
              {documentos.some(d => d.tipo === 'cuit') ? 'CUIT Subido' : 'Subir CUIT'}
              <input
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleDocumentoChange(e, 'cuit')}
              />
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Comprobante de Domicilio */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Comprobante de Domicilio
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
              color={documentos.some(d => d.tipo === 'comprobante_domicilio') ? "success" : "primary"}
            >
              {documentos.some(d => d.tipo === 'comprobante_domicilio') ? 'Comprobante Subido' : 'Subir Comprobante'}
              <input
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleDocumentoChange(e, 'comprobante_domicilio')}
              />
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Factura de servicios (luz, gas o agua)
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Balance Contable () */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Balance Contable
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
              color={documentos.some(d => d.tipo === 'balance_contable') ? "success" : "primary"}
            >
              {documentos.some(d => d.tipo === 'balance_contable') ? 'Balance Subido' : 'Subir Balance'}
              <input
                type="file"
                hidden
                accept=".pdf"
                onChange={(e) => handleDocumentoChange(e, 'balance_contable')}
              />
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Declaración de Impuestos () */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Declaración de Impuestos
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
              color={documentos.some(d => d.tipo === 'declaracion_impuestos') ? "success" : "primary"}
            >
              {documentos.some(d => d.tipo === 'declaracion_impuestos') ? 'DDJJ Subida' : 'Subir DDJJ'}
              <input
                type="file"
                hidden
                accept=".pdf"
                onChange={(e) => handleDocumentoChange(e, 'declaracion_impuestos')}
              />
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Lista de documentos subidos */}
      <Grid size={{ xs: 12 }}>
        {renderListaDocumentos()}
      </Grid>

      {/* Resumen de documentos obligatorios */}
      <Grid size={{ xs: 12 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
          {['dni', 'cuit', 'comprobante_domicilio'].map(tipo => (
            <Chip
              key={tipo}
              label={obtenerNombreTipo(tipo)}
              color={documentos.some(d => d.tipo === tipo) ? "success" : "default"}
              variant={documentos.some(d => d.tipo === tipo) ? "filled" : "outlined"}
              size="small"
            />
          ))}
        </Box>
      </Grid>
    </Grid>
  );
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                {...register('monto', {
                  valueAsNumber: true,
                })}
                label="Monto Solicitado (ARS)"
                type="number"
                fullWidth
                error={!!errors.monto}
                helperText={errors.monto?.message}
                InputProps={{
                  startAdornment: <Typography>$</Typography>
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                {...register('plazo_meses', {
                  valueAsNumber: true,
                })}
                label="Plazo en Meses"
                type="number"
                fullWidth
                error={!!errors.plazo_meses}
                helperText={errors.plazo_meses?.message}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Moneda</InputLabel>
                <Select
                  {...register('moneda')}
                  label="Moneda"
                  defaultValue="ARS"
                  error={!!errors.moneda}
                >
                  <MenuItem value="ARS">Pesos Argentinos (ARS)</MenuItem>
                  <MenuItem value="USD">Dólares Estadounidenses (USD)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                {...register('proposito')}
                label="Propósito del Crédito"
                multiline
                rows={4}
                fullWidth
                error={!!errors.proposito}
                helperText={errors.proposito?.message}
                placeholder="Describa para qué utilizará el crédito solicitado..."
              />
            </Grid>
          </Grid>
        );

      case 1:
        return renderControlesDocumentos();

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Resumen de la Solicitud
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2">Monto Solicitado:</Typography>
              <Typography variant="body1">${monto} ARS</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2">Plazo:</Typography>
              <Typography variant="body1">{plazoMeses} meses</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2">Documentos Subidos:</Typography>
              <Typography variant="body2" color="text.secondary">
                {documentos.length} archivos
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">
                Revise toda la información antes de enviar. Una vez enviada, no podrá modificar la solicitud.
              </Alert>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box textAlign="center" py={4}>
            <Typography variant="h5" color="success.main" gutterBottom>
              . Solicitud Enviada Exitosamente
            </Typography>
            <Typography variant="body1" gutterBottom>
              Su solicitud de crédito ha sido enviada para revisión.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Número de solicitud: {solicitudId}
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 3 }}
              onClick={() => window.location.href = '/solicitante'}
            >
              Ver Mis Solicitudes
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (<>
      {/* 🟢 Overlay de carga global */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loadingOverlay}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Enviando solicitud, por favor espere...
        </Typography>
      </Backdrop>
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>{renderStepContent(activeStep)}</CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Box>
          <Button disabled={activeStep === 0 || activeStep === 3} onClick={handleBack}>
            Atrás
          </Button>
          
          {/* Botón de cancelar */}
          {activeStep < 3 && (
            <Button 
              onClick={limpiarFormulario}
              sx={{ ml: 1 }}
              color="error"
              variant="outlined"
            >
              Cancelar
            </Button>
          )}
        </Box>

        <Box>
          {/* Paso 0: validar formulario antes de avanzar */}
          {activeStep === 0 && (
            <Button
              variant="contained"
              onClick={handleSubmit(() => setActiveStep(1))}
            >
              Siguiente
            </Button>
          )}

          {/* Paso 1: verificar documentos */}
{activeStep === 1 && (
  <Button
    variant="contained"
    onClick={() => {
      const documentosObligatorios = ['dni', 'cuit', 'comprobante_domicilio'];
      const documentosFaltantes = documentosObligatorios.filter(
        tipo => !documentos.some(doc => doc.tipo === tipo)
      );

      if (documentosFaltantes.length > 0) {
        setError(`Faltan documentos obligatorios: ${documentosFaltantes.map(obtenerNombreTipo).join(', ')}`);
        return;
      }
      setError('');
      setActiveStep(2);
    }}
  >
    Siguiente
  </Button>
)}

          {/* Paso 2: botón de envío real */}
          {activeStep === 2 && (
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
      </>
  );
}