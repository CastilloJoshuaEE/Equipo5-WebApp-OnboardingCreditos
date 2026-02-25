// frontend/src/components/FirmaDigital/VisorWordFirma.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Alert,
    Toolbar,
    AppBar,
    IconButton,
    LinearProgress
} from '@mui/material';
import {
    Edit,
    Save,
    ZoomIn,
    ZoomOut,
    FitScreen,
    DragIndicator,
    Close
} from '@mui/icons-material';
import EditorFirma from './EditorFirma';
import { getSession } from 'next-auth/react';
import { VisorWordFirmaProps } from '../ui/visor_word';
import { PosicionFirma } from '../ui/firma';
import { Firma } from '../ui/firma';
import { InfoFirmaData } from '@/features/firma_digital/firmaDigital.types';
import { ProcesarDocumentoBase64 } from '@/features/contratos/contrato.types';
import Image from 'next/image';
const VisorWordFirma: React.FC<VisorWordFirmaProps> = ({ 
    onFirmaCompletada,
    modoFirma = false,
    firmaId 
}) => {
    const [firmas, setFirmas] = useState<Firma[]>([]);
    const [modoAgregarFirma, setModoAgregarFirma] = useState(false);
    const [posicionFirma, setPosicionFirma] = useState<PosicionFirma | null>(null);
    const [editorFirmaAbierto, setEditorFirmaAbierto] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [contenidoReal, setContenidoReal] = useState<string>('');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string>('');
    const [infoFirma, setInfoFirma] = useState<InfoFirmaData | null>(null);
    const [firmaSeleccionada, setFirmaSeleccionada] = useState<string | null>(null);
    
    const documentoRef = useRef<HTMLDivElement>(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const contadorFirmas = useRef(0); // Contador para claves únicas



const cargarContenidoReal = useCallback(async () => {        try {
            setCargando(true);
            setError('');
            
            const session = await getSession();
            if (!session?.accessToken) {
                setError('No hay sesión activa');
                setCargando(false);
                return;
            }

            console.log('. Cargando información de firma para:', firmaId);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            
            const response = await fetch(`${API_URL}/firmas/info-firma-word/${firmaId}`, {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                setInfoFirma(result.data);
                
                const datosSolicitante = result.data.solicitante || {};
                const datosContrato = {
                    nombre_completo: datosSolicitante.nombre_completo,
                    dni: datosSolicitante.dni,
                    domicilio: datosSolicitante.domicilio || 'Dirección no disponible',
                    nombre_empresa: datosSolicitante.nombre_empresa || '',
                    cuit: datosSolicitante.cuit || '',
                    representante_legal: datosSolicitante.representante_legal || '',
                    email: datosSolicitante.email,
                    numero_solicitud: result.data.firma?.solicitudes_credito?.numero_solicitud || 'N/A'
                };
                
                procesarDocumentoBase64(result.data.documento, datosContrato);
            } else {
                setError(result.message || 'Error en la respuesta del servidor');
            }
        }  catch (error: unknown) {
  const message =
    error instanceof Error ? error.message : "Error desconocido";
  console.error("Error cargando información de firma:", error);
  setError(message);
} finally {
            setCargando(false);
        }
    }, [firmaId]);
    // Cargar contenido real del contrato
    useEffect(() => {
        if (firmaId) {
            cargarContenidoReal();
        }
    },[firmaId, cargarContenidoReal]);
const procesarDocumentoBase64: ProcesarDocumentoBase64 = (
  _documentoBase64,
  datosReales
) => {
        try {
            if (!datosReales) {
                console.warn('. No hay datos reales disponibles, usando datos por defecto');
                datosReales = {
                    nombre_completo: 'Nombre no disponible',
                    dni: 'N/A',
                    domicilio: 'Dirección no disponible',
                    nombre_empresa: '',
                    cuit: '',
                    representante_legal: '',
                    email: 'email@nodisponible.com',
                    numero_solicitud: 'N/A'
                };
            }

            const {
                nombre_completo = 'Nombre no disponible',
                dni = 'N/A',
                domicilio = 'Dirección no disponible',
                nombre_empresa = '',
                cuit = '',
                representante_legal = '',
                email = 'email@nodisponible.com',
                numero_solicitud = 'N/A'
            } = datosReales || {};

            const contenidoEstructurado = `
CONTRATO DE AUTORIZACIÓN DE GESTIÓN DE CRÉDITO Y SERVICIOS DE ASESORÍA FINANCIERA

Entre:
NEXIA S.A., con domicilio en Argentina, legalmente representada por Ramiro Rodriguez, 
en adelante "NEXIA",

y
${nombre_completo}, portador/a del DNI ${dni}, 
con domicilio en ${domicilio}, en adelante "EL SOLICITANTE",

${nombre_empresa ? `EMPRESA: ${nombre_empresa}` : ''}
${cuit ? `CUIT: ${cuit}` : ''}
${representante_legal ? `REPRESENTANTE LEGAL: ${representante_legal}` : ''}

se celebra el presente Contrato de Autorización, conforme a las siguientes cláusulas:

PRIMERA: OBJETO
El presente contrato tiene por objeto autorizar a NEXIA a gestionar, tramitar y/o intermediar en nombre de EL SOLICITANTE las solicitudes de crédito ante las instituciones financieras con las cuales mantiene convenios o relaciones comerciales, con el fin de facilitar el acceso a productos financieros acordes al perfil crediticio del solicitante.

SEGUNDA: ALCANCE DE LA AUTORIZACIÓN
EL SOLICITANTE autoriza expresamente a NEXIA a:
1. Consultar su información crediticia ante burós y entidades financieras autorizadas.
2. Gestionar documentos, formularios y requisitos necesarios para la tramitación de crédito.
3. Comunicarle resultados, observaciones o requerimientos derivados del proceso de solicitud.

TERCERA: CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS
NEXIA se compromete a tratar toda la información personal y financiera de EL SOLICITANTE conforme a las leyes de protección de datos personales vigentes, garantizando su confidencialidad y uso exclusivo para los fines de este contrato.

CUARTA: VIGENCIA
El presente contrato entrará en vigor a partir de la fecha de firma digital y tendrá una vigencia de seis (6) meses, pudiendo renovarse automáticamente si las partes así lo acuerdan.

QUINTA: NO GARANTÍA DE APROBACIÓN
EL SOLICITANTE reconoce que la aprobación del crédito depende exclusivamente de las políticas de las instituciones financieras, y que NEXIA actúa únicamente como intermediario o asesor.

SEXTA: ACEPTACIÓN Y FIRMA DIGITAL
Ambas partes aceptan los términos de este contrato. EL SOLICITANTE declara haber leído y comprendido todas las cláusulas.
La firma digital de este documento implica consentimiento pleno y aceptación legal conforme a la legislación vigente.

Fecha de aprobación de solicitud: ${new Date().toLocaleDateString()}
Nombre del solicitante: ${nombre_completo}
DNI: ${dni}
Correo electrónico: ${email}
Número de solicitud: ${numero_solicitud}

FIRMAS:

_________________________
${nombre_completo}
Solicitante

_________________________
Representante NEXIA S.A.

Fecha: ${new Date().toLocaleDateString()}
            `;
            setContenidoReal(contenidoEstructurado);
        } catch (error) {
            console.error('Error procesando documento:', error);
            setContenidoReal('Error al cargar el contenido del documento.');
        }
    };

    const handleSeleccionarPosicion = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!modoAgregarFirma || !documentoRef.current || isDragging.current) return;

        const rect = documentoRef.current.getBoundingClientRect();
        const x = (event.clientX - rect.left) / zoom;
        const y = (event.clientY - rect.top) / zoom;

        setPosicionFirma({
            x: x,
            y: y,
            pagina: 1
        });

        setModoAgregarFirma(false);
        setEditorFirmaAbierto(true);
    };

    const handleFirmaGuardada = (firmaData: Firma) => {
        if (!posicionFirma) return;

        // Generar ID único usando contador y timestamp
        contadorFirmas.current += 1;
        const firmaIdUnico = `firma-${contadorFirmas.current}-${Date.now()}`;

        const nuevaFirma: Firma = {
            ...firmaData,
            posicion: posicionFirma,
            id: firmaIdUnico, // ID único garantizado
            fecha: new Date().toISOString(),
            tamaño: { width: 150, height: 80 }
        };

        setFirmas(prev => [...prev, nuevaFirma]);
        setPosicionFirma(null);
        setFirmaSeleccionada(nuevaFirma.id);
    };

    // FUNCIONES .S PARA ARRASTRAR FIRMAS
    const handleMouseDown = (event: React.MouseEvent, firmaId: string) => {
        event.stopPropagation();
        event.preventDefault();
        
        setFirmaSeleccionada(firmaId);
        isDragging.current = true;
        
        const firma = firmas.find(f => f.id === firmaId);
        if (!firma || !documentoRef.current) return;

        const rect = documentoRef.current.getBoundingClientRect();
        const scaledX = firma.posicion.x * zoom;
        const scaledY = firma.posicion.y * zoom;
        
        dragOffset.current = {
            x: event.clientX - rect.left - scaledX,
            y: event.clientY - rect.top - scaledY
        };

        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);
    };

    const handleGlobalMouseMove = (event: MouseEvent) => {
        if (!isDragging.current || !firmaSeleccionada || !documentoRef.current) return;

        const firma = firmas.find(f => f.id === firmaSeleccionada);
        if (!firma) return;

        const rect = documentoRef.current.getBoundingClientRect();
        
        // Calcular nueva posición sin límites estrictos
        const newX = (event.clientX - rect.left - dragOffset.current.x) / zoom;
        const newY = (event.clientY - rect.top - dragOffset.current.y) / zoom;

        // Permitir movimiento libre, solo evitar posiciones negativas
        const clampedX = Math.max(0, newX);
        const clampedY = Math.max(0, newY);

        setFirmas(prev => prev.map(f =>
            f.id === firmaSeleccionada 
                ? { 
                    ...f, 
                    posicion: { ...f.posicion, x: clampedX, y: clampedY } 
                } 
                : f
        ));
    };

    const handleGlobalMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
    };

    const eliminarFirma = (firmaId: string) => {
        setFirmas(prev => prev.filter(f => f.id !== firmaId));
        if (firmaSeleccionada === firmaId) {
            setFirmaSeleccionada(null);
        }
    };

const handleGuardarDocumento = async () => {
    try {
        setCargando(true);
        setError('');
        
        const session = await getSession();
        if (!session?.accessToken) {
            throw new Error('No hay sesión activa');
        }

        // Validar que tenemos firmas
        if (firmas.length === 0) {
            throw new Error('Debe agregar al menos una firma al documento');
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
        const firma_data = {
            nombreFirmante: session.user?.name || session.user?.email || 'Usuario',
            ubicacion: ubicacion,
            fechaFirma: new Date().toISOString(),
            tipoFirma: 'texto', // o 'dibujo' según corresponda
            firmaTexto: session.user?.name || 'Firma',
            firmaImagen: firmas.find(f => f.tipoFirma === 'dibujo')?.firmaImagen,
            ipFirmante: '', // Se completa en el backend
            userAgent: navigator.userAgent,
            hashDocumento: infoFirma?.hash_original
        };

        console.log('. Enviando firma acumulativa al servidor...', {
            tipo_firma: tipoFirma,
            tiene_firma_data: !!firma_data,
            firmas_count: firmas.length
        });

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        const response = await fetch(`${API_URL}/firmas/procesar-firma-word/${firmaId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firma_data: firma_data,
                tipo_firma: tipoFirma
                // . NO enviar documento_modificado - el backend lo genera automáticamente
            })
        });

        console.log(' Respuesta del servidor:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('. Resultado de firma acumulativa:', result);
        
        if (result.success) {
            // . MANEJAR RESPUESTA .
            onFirmaCompletada({
                ...result.data,
                es_firma_completa: result.data.integridad_valida,
                estado: result.data.estado
            });
        } else {
            throw new Error(result.message || 'Error en la respuesta del servidor');
        }
    }  catch (error: unknown) {
  const message =
    error instanceof Error ? error.message : "Error desconocido";
  console.error("Error guardando información de firma:", error);
  setError(message);
} finally {
        setCargando(false);
    }
};

    const aumentarZoom = () => setZoom(prev => Math.min(prev + 0.1, 2));
    const disminuirZoom = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const resetZoom = () => setZoom(1);

    // COMPONENTE DE FIRMA ARRASTRABLE 
    const FirmaArrastrable = ({ firma }: { firma: Firma }) => {
        const isSelected = firmaSeleccionada === firma.id;

        return (
            <Box
                sx={{
                    position: 'absolute',
                    left: firma.posicion.x,
                    top: firma.posicion.y,
                    border: isSelected ? '2px solid #1976d2' : '1px solid #ccc',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '8px',
                    borderRadius: 1,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    width: firma.tamaño.width,
                    minHeight: firma.tamaño.height,
                    zIndex: isSelected ? 1000 : 100,
                    cursor: 'grab',
                    userSelect: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        borderColor: '#1976d2',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        transform: 'scale(1.02)'
                    },
                    '&:active': {
                        cursor: 'grabbing'
                    }
                }}
                onMouseDown={(e) => handleMouseDown(e, firma.id)}
            >
                {/* Header de la firma con controles */}
                <Box 
                    sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 1,
                        padding: '2px 4px',
                        backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                        borderRadius: '4px',
                        cursor: 'grab'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <DragIndicator 
                            sx={{ 
                                fontSize: 16, 
                                color: '#666',
                                cursor: 'grab'
                            }} 
                        />
                        <Typography variant="caption" sx={{ ml: 1, color: '#666' }}>
                            Arrastrar
                        </Typography>
                    </Box>
                    
                    {/* SOLO MOSTRAR BOTÓN ELIMINAR CUANDO ESTÁ SELECCIONADA */}
                    {isSelected && (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                eliminarFirma(firma.id);
                            }}
                            sx={{ 
                                padding: '2px',
                                color: '#f44336',
                                '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                            }}
                        >
                            <Close sx={{ fontSize: 14 }} />
                        </IconButton>
                    )}
                </Box>

                {/* Contenido de la firma */}
                <Box sx={{ textAlign: 'center', cursor: 'grab' }}>
                    {firma.tipoFirma === 'texto' ? (
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                fontFamily: firma.estilo === 'cursiva' ? 'cursive' : 'inherit',
                                fontWeight: firma.estilo === 'negrita' ? 'bold' : 'normal',
                                fontSize: '0.9rem'
                            }}
                        >
                            {firma.firmaTexto}
                        </Typography>
                    ) : firma.tipoFirma === 'dibujo' ? (
<Image
  src={firma.firmaImagen || ""}
  alt="Firma"
  width={160}
  height={60}
  style={{ objectFit: "contain" }}
/>
                    ) : null}
                    
                    <Typography 
                        variant="caption" 
                        display="block" 
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                    >
                        {new Date(firma.fecha).toLocaleTimeString()}
                    </Typography>
                </Box>
            </Box>
        );
    };

    if (cargando) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <LinearProgress sx={{ width: '100%', mb: 2 }} />
                <Typography>Cargando contrato...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error" onClose={() => setError('')}>
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Barra de herramientas SIMPLIFICADA */}
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar variant="dense">
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Editor de Contrato
                    </Typography>
                    
                    {firmaSeleccionada && (
                        <Typography variant="body2" sx={{ mr: 2, color: '#1976d2' }}>
                            Firma seleccionada ✓
                        </Typography>
                    )}
                    
                    {/* ELIMINADOS: Botones de Deshacer/Rehacer */}
                    
                    <IconButton onClick={disminuirZoom}>
                        <ZoomOut />
                    </IconButton>
                    
                    <Typography variant="body2" sx={{ mx: 1 }}>
                        {Math.round(zoom * 100)}%
                    </Typography>
                    
                    <IconButton onClick={aumentarZoom}>
                        <ZoomIn />
                    </IconButton>
                    
                    <IconButton onClick={resetZoom}>
                        <FitScreen />
                    </IconButton>
                
                    
                    {modoFirma && (
                        <Button
                            variant="contained"
                            startIcon={<Edit />}
                            onClick={() => setModoAgregarFirma(true)}
                            sx={{ ml: 2 }}
                            disabled={cargando}
                        >
                            Agregar Firma
                        </Button>
                    )}
                    
                    {firmas.length > 0 && (
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleGuardarDocumento}
                            sx={{ ml: 1 }}
                            color="success"
                            disabled={cargando}
                        >
                            {cargando ? 'Guardando...' : 'Guardar Documento'}
                        </Button>
                    )}
                </Toolbar>
            </AppBar>

            {/* Contenido del documento */}
            <Paper
                ref={documentoRef}
                elevation={2}
                sx={{
                    flexGrow: 1,
                    margin: 2,
                    overflow: 'auto',
                    position: 'relative',
                    border: modoAgregarFirma ? '2px dashed #1976d2' : '1px solid #e0e0e0',
                    backgroundColor: 'white',
                    cursor: modoAgregarFirma ? 'crosshair' : 'default',
                    minHeight: '800px',
                    background: 'linear-gradient(white 95%, #f5f5f5 95%)',
                    backgroundSize: '100% 24px'
                }}
                onClick={handleSeleccionarPosicion}
            >
                {modoAgregarFirma && (
                    <Alert 
                        severity="info" 
                        sx={{ 
                            position: 'absolute', 
                            top: 8, 
                            left: 8, 
                            right: 8,
                            zIndex: 10 
                        }}
                    >
                        Haz clic en cualquier parte del documento para colocar la firma
                    </Alert>
                )}

                <Box sx={{ 
                    p: 4, 
                    fontFamily: 'Times New Roman, serif', 
                    fontSize: '12pt', 
                    lineHeight: 1.6,
                    position: 'relative',
                    minHeight: '100%',
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    width: `${100 / zoom}%`,
                    height: `${100 / zoom}%`,
                    whiteSpace: 'pre-line'
                }}>
                    {contenidoReal.split('\n').map((linea, index) => {
                        // Determinar el estilo según el contenido
                        let estilo = {};
                        
                        if (linea.includes('CONTRATO DE AUTORIZACIÓN')) {
                            estilo = { 
                                fontWeight: 'bold', 
                                fontSize: '1.3rem', 
                                textAlign: 'center',
                                marginBottom: '1rem'
                            };
                        } else if (linea.match(/^[A-Z]+:/) && !linea.includes('_')) {
                            // Títulos de cláusulas (PRIMERA:, SEGUNDA:, etc.)
                            estilo = { 
                                fontWeight: 'bold', 
                                marginTop: '1rem',
                                marginBottom: '0.5rem'
                            };
                        } else if (linea.match(/^\d+\./)) {
                            // Elementos de lista numerados
                            estilo = { 
                                marginLeft: '2rem',
                                textIndent: '-1rem',
                                marginBottom: '0.25rem'
                            };
                        } else if (linea.trim() === '') {
                            // Líneas vacías
                            return <br key={`linea-${index}`} />;
                        } else if (linea.includes('_________________________')) {
                            // Líneas de firma
                            estilo = { 
                                textAlign: 'center',
                                marginTop: '2rem'
                            };
                        }

                        return (
                            <Typography 
                                key={`linea-${index}`} 
                                variant="body1" 
                                sx={{ 
                                    mb: linea.trim() ? 0.5 : 0.25,
                                    ...estilo,
                                    fontFamily: 'inherit'
                                }}
                            >
                                {linea}
                            </Typography>
                        );
                    })}

                    {/* Mostrar firmas arrastrables con claves únicas */}
                    {firmas.map((firma) => (
                        <FirmaArrastrable key={firma.id} firma={firma} />
                    ))}
                </Box>
            </Paper>

            {/* Instrucciones */}
            {firmas.length > 0 && (
                <Alert severity="info" sx={{ m: 2, mt: 0 }}>
                    💡 <strong>Instrucciones:</strong> Haz clic y arrastra para mover las firmas libremente por todo el documento. 
                    Selecciona una firma y haz clic en la X para eliminarla.
                </Alert>
            )}

            {/* Editor de firma */}
            <EditorFirma
                open={editorFirmaAbierto}
                onClose={() => setEditorFirmaAbierto(false)}
                onFirmaGuardada={handleFirmaGuardada}
            />
        </Box>
    );
};

export default VisorWordFirma;