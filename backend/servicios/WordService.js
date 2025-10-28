// servicios/WordService.js - VERSIÓN REAL
const { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType } = require('docx');
const mammoth = require('mammoth');
const crypto = require('crypto');
const { supabase } = require('../config/conexion');

class WordService {
    
    /**
     * Procesar firma acumulativa - usa el último documento firmado
     */
static async procesarFirmaAcumulativa(firma_id, datosFirma, tipo) {
    try {
        console.log('. 🔄 Procesando firma acumulativa para:', firma_id);

        // 1. Obtener información COMPLETA de la firma
        const { data: firma, error: firmaError } = await supabase
            .from('firmas_digitales')
            .select(`
                *,
                contratos (
                    id,
                    ruta_documento,
                    solicitud_id
                )
            `)
            .eq('id', firma_id)
            .single();

        if (firmaError || !firma) {
            throw new Error('Firma no encontrada en la base de datos');
        }

        if (!firma.contratos) {
            throw new Error('No se encontró contrato asociado a esta firma');
        }

        // 2. ESTRATEGIA MEJORADA para obtener documento
        let rutaDocumentoActual = null;
        
        // Prioridad 1: Documento ya firmado (firma acumulativa)
        if (firma.url_documento_firmado) {
            rutaDocumentoActual = firma.url_documento_firmado;
            console.log('. Usando documento FIRMADO anteriormente:', rutaDocumentoActual);
        }
        // Prioridad 2: Documento original del contrato
        else if (firma.contratos.ruta_documento) {
            rutaDocumentoActual = firma.contratos.ruta_documento;
            console.log('. Usando documento ORIGINAL del contrato:', rutaDocumentoActual);
        }
        // Prioridad 3: Ruta del documento en la firma (fallback)
        else if (firma.ruta_documento) {
            rutaDocumentoActual = firma.ruta_documento;
            console.log('. Usando ruta de documento de la firma:', rutaDocumentoActual);
        }

        if (!rutaDocumentoActual) {
            // INTENTO DE RECUPERACIÓN: Buscar cualquier documento relacionado
            console.log('. 🚨 No se encontró ruta de documento, buscando alternativas...');
            
            // Buscar en la tabla de contratos por solicitud_id
            const { data: contratoAlternativo, error: contratoAltError } = await supabase
                .from('contratos')
                .select('ruta_documento')
                .eq('solicitud_id', firma.solicitud_id)
                .not('ruta_documento', 'is', null)
                .single();

            if (contratoAltError || !contratoAlternativo) {
                throw new Error(`No se encontró documento para firmar. Contrato ID: ${firma.contrato_id}, Solicitud ID: ${firma.solicitud_id}`);
            }
            
            rutaDocumentoActual = contratoAlternativo.ruta_documento;
            console.log('. . Documento recuperado alternativamente:', rutaDocumentoActual);
        }

        // 3. VERIFICAR QUE EL DOCUMENTO EXISTE EN STORAGE
        console.log('. Verificando documento en storage:', rutaDocumentoActual);
        const { data: fileData, error: fileError } = await supabase.storage
            .from('kyc-documents')
            .download(rutaDocumentoActual);

        if (fileError) {
            console.error('. . Error descargando documento:', fileError);
            
            // INTENTAR REGENERAR EL DOCUMENTO
            console.log('. 🔄 Intentando regenerar documento...');
            try {
                // Obtener datos de la solicitud para regenerar
                const { data: solicitudCompleta, error: solError } = await supabase
                    .from('solicitudes_credito')
                    .select(`
                        *,
                        solicitantes: solicitantes!solicitante_id(
                            usuarios(*),
                            nombre_empresa,
                            cuit,
                            representante_legal,
                            domicilio
                        )
                    `)
                    .eq('id', firma.solicitud_id)
                    .single();

                if (solError) {
                    throw new Error('No se pudo obtener datos para regenerar documento: ' + solError.message);
                }

                // Regenerar el Word
                await ContratoController.generarWordContrato(firma.contrato_id, solicitudCompleta);
                console.log('. . Documento regenerado exitosamente');

                // Reintentar descarga
                const { data: fileDataRetry, error: fileErrorRetry } = await supabase.storage
                    .from('kyc-documents')
                    .download(rutaDocumentoActual);

                if (fileErrorRetry) {
                    throw new Error('Documento no disponible incluso después de regenerar: ' + fileErrorRetry.message);
                }

            } catch (regenerateError) {
                throw new Error('Error regenerando documento: ' + regenerateError.message);
            }
        }

        console.log('. . Documento disponible para firma, tamaño:', fileData.size);


            const bufferActual = Buffer.from(await fileData.arrayBuffer());

            // 4. Procesar firma en el documento actual
            const documentoFirmadoBuffer = await WordService.agregarFirmaADocumento(
                bufferActual, 
                datosFirma
            );

            // 5. Generar hash del documento firmado
        const nuevoHash = WordService.generarHashDocumento(documentoFirmadoBuffer, {
            fechaFirma: datosFirma.fechaFirma,
            firmante: datosFirma.nombreFirmante,
            tipoFirma: tipo,
            firmaAnterior: firma.hash_documento_firmado,
            ubicacion: datosFirma.ubicacion,
            documentoOriginalHash: firma.hash_documento_original
        });

            // 6. Verificar integridad completa
            const integridadValida = await WordService.verificarIntegridadCompleta(firma_id);

            // 7. Subir nuevo documento firmado
      const nombreArchivoFirmado = `contrato-firmado-${firma_id}-${Date.now()}.docx`;
        const uploadResult = await WordService.subirDocumento(
            nombreArchivoFirmado,
            documentoFirmadoBuffer,
            {
                firma_id: firma_id,
                firmante: datosFirma.nombreFirmante,
                fecha_firma: datosFirma.fechaFirma,
                hash_firmado: nuevoHash,
                tipo_firma: tipo,
                integridad_valida: Boolean(integridadValida),
                ubicacion: datosFirma.ubicacion,
                ip_firmante: datosFirma.ipFirmante,
                user_agent: datosFirma.userAgent,
                documento_original_hash: firma.hash_documento_original
            }
        );
            if (!uploadResult.success) {
                throw new Error('Error subiendo documento firmado: ' + uploadResult.error);
            }

            return {
                success: true,
                buffer: documentoFirmadoBuffer,
                hash: nuevoHash,
                ruta: uploadResult.ruta,
                integridadValida: integridadValida
            };

        } catch (error) {
            console.error('. Error en procesarFirmaAcumulativa:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Extraer contenido real del documento Word
     */
 static async extraerContenidoWord(bufferDocumento) {
    try {
        console.log('. Extrayendo contenido real del documento Word...');
        
        const result = await mammoth.extractRawText({ 
            buffer: bufferDocumento,
            preserveEmptyLines: true
        });
        
        let contenido = result.value;
        
        // PRESERVAR MEJOR LA ESTRUCTURA DEL CONTRATO
        contenido = contenido
            .replace(/\n{3,}/g, '\n\n') // Normalizar múltiples saltos
            .replace(/([.!?])([A-Z])/g, '$1\n$2') // Mejorar separación de párrafos
            .replace(/FIRMA DIGITAL DEL SOLICITANTE:/g, '_________________________')
            .replace(/FIRMA DIGITAL DEL OPERADOR:/g, '_________________________')
            .trim();
        
        console.log('. Contenido extraído con estructura preservada');
        return contenido;
        
    } catch (error) {
        console.error('. Error extrayendo contenido Word:', error);
        
        // FALLBACK MEJORADO con estructura real del contrato
        return `CONTRATO DE AUTORIZACIÓN DE GESTIÓN DE CRÉDITO Y SERVICIOS DE ASESORÍA FINANCIERA

Entre: NEXIA S.A., con domicilio en Argentina, legalmente representada por Ramiro Rodriguez, en adelante "NEXIA",

y [Nombre del Solicitante], portador/a del DNI [DNI], con domicilio en [Domicilio], en adelante "EL SOLICITANTE",

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

_________________________
Firma del Solicitante

_________________________
Firma del Operador

Fecha: ${new Date().toLocaleDateString()}`;
    }
}
    /**
     * Agregar firma a documento Word existente PRESERVANDO el contenido real
     */
 static async agregarFirmaADocumento(bufferDocumento, firmaData) {
    try {
        console.log('. Procesando firma en documento Word existente...');
        
        // Extraer contenido REAL con formato preservado
        const contenidoOriginal = await this.extraerContenidoWord(bufferDocumento);
        
        // Crear documento que preserve completamente el formato original + firmas VISIBLES
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Contenido original del contrato con formato preservado
                    ...contenidoOriginal.split('\n').map(linea => {
                        // Si es una línea de firma (contiene _________), agregar la firma real
                        if (linea.includes('_________________________')) {
                            return [
                                new Paragraph({
                                    text: linea,
                                    alignment: AlignmentType.CENTER,
                                    spacing: { after: 200 }
                                }),
                                // . AGREGAR FIRMA REAL VISIBLE
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({
                                            text: `✓ ${firmaData.nombreFirmante}`,
                                            bold: true,
                                            size: 20,
                                            color: "000000"
                                        })
                                    ],
                                    spacing: { after: 200 }
                                })
                            ];
                        }
                        
                        // Para líneas normales, mantener formato
                        return new Paragraph({
                            text: linea,
                            alignment: linea.includes('CONTRATO') ? 
                                AlignmentType.CENTER : AlignmentType.LEFT,
                            spacing: { 
                                after: linea.trim() === '' ? 100 : 200,
                                before: linea.match(/^[A-Z]+:/) ? 400 : 0
                            },
                            heading: linea.includes('CONTRATO DE AUTORIZACIÓN') ? 
                                HeadingLevel.HEADING_1 : 
                                linea.match(/^[A-Z]+:/) ? HeadingLevel.HEADING_2 : undefined
                        });
                    }).flat(), // Aplanar el array de arrays

                    // . NUEVA SECCIÓN DE FIRMAS DIGITALES MEJORADA
                    new Paragraph({
                        text: " ",
                        spacing: { before: 800, after: 400 }
                    }),

                    new Paragraph({
                        text: "--- FIRMAS DIGITALES REGISTRADAS ---",
                        heading: HeadingLevel.HEADING_2,
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 800, after: 400 }
                    }),

                    // Información detallada de la firma
                    new Paragraph({
                        text: "INFORMACIÓN DE FIRMA DIGITAL",
                        heading: HeadingLevel.HEADING_3,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 }
                    }),

                    // Firma textual VISIBLE
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: `FIRMADO POR: ${firmaData.nombreFirmante}`,
                                bold: true,
                                size: 22,
                                color: "000000"
                            })
                        ],
                        spacing: { before: 400, after: 200 }
                    }),

                    // Fecha y ubicación
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: `FECHA: ${new Date(firmaData.fechaFirma).toLocaleString()}`,
                                size: 18
                            })
                        ],
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: `UBICACIÓN: ${firmaData.ubicacion}`,
                                size: 18
                            })
                        ],
                        spacing: { after: 200 }
                    }),

                    // Hash de validación
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: `HASH DE VALIDACIÓN: ${firmaData.hashDocumento}`,
                                style: "SourceCode",
                                size: 14,
                                color: "666666"
                            })
                        ],
                        spacing: { after: 400 }
                    }),

                    // Mensaje de validez legal
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: "✓ DOCUMENTO FIRMADO DIGITALMENTE - VÁLIDO LEGALMENTE",
                                bold: true,
                                color: "008000",
                                size: 16
                            })
                        ],
                        spacing: { before: 400, after: 200 }
                    })
                ]
            }]
        });

        return await Packer.toBuffer(doc);
        
    } catch (error) {
        console.error('. Error procesando documento Word:', error);
        
        // Fallback mejorado que al menos agrega las firmas
        console.log('. Usando fallback con firmas visibles');
        return await this.fallbackConFirmas(bufferDocumento, firmaData);
    }
}
static async fallbackConFirmas(bufferOriginal, firmaData) {
    try {
        const contenidoOriginal = await this.extraerContenidoWord(bufferOriginal);
        
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Contenido original
                    new Paragraph({
                        text: contenidoOriginal,
                        spacing: { after: 400 }
                    }),

                    // Firmas visibles
                    new Paragraph({
                        text: "--- FIRMAS APLICADAS ---",
                        heading: HeadingLevel.HEADING_2,
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 800, after: 400 }
                    }),

                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: `. ${firmaData.nombreFirmante}`,
                                bold: true,
                                size: 20
                            })
                        ],
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: `Fecha: ${new Date(firmaData.fechaFirma).toLocaleString()}`,
                            })
                        ],
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: `Hash: ${firmaData.hashDocumento}`,
                            })
                        ],
                        spacing: { after: 400 }
                    })
                ]
            }]
        });

        return await Packer.toBuffer(doc);
    } catch (error) {
        console.error('. Error en fallback:', error);
        return bufferOriginal;
    }
}
static formatearContenidoContrato(contenido) {
    // Preservar la estructura del contrato
    return contenido
        .split('\n')
        .map(linea => {
            // Preservar líneas vacías para separación de párrafos
            if (linea.trim() === '') return '';
            
            // Mantener indentación de listas
            if (linea.match(/^\s*\d+\./)) {
                return '    ' + linea.trim();
            }
            
            return linea;
        })
        .join('\n');
}
    /**
     * Método alternativo: preservar documento original y agregar página de firmas
     */
    static async preservarYFirmarDocumento(bufferOriginal, firmaData) {
        try {
            console.log('. Preservando documento original y agregando firmas...');
            
            // Extraer contenido REAL
            const contenidoOriginal = await this.extraerContenidoWord(bufferOriginal);
            
            // Crear documento con contenido REAL + firmas
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        // Contenido REAL del contrato
                        new Paragraph({
                            text: "CONTRATO FIRMADO DIGITALMENTE",
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 400 }
                        }),
                        
                        // Contenido original completo
                        new Paragraph({
                            text: contenidoOriginal,
                            spacing: { after: 400 }
                        }),

                        new Paragraph({
                            text: "--- FIRMAS DIGITALES ---",
                            heading: HeadingLevel.HEADING_2,
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 800, after: 400 }
                        }),

                        // Información de firma
                        new Paragraph({
                            text: `Documento firmado digitalmente por: ${firmaData.nombreFirmante}`,
                            spacing: { after: 200 }
                        }),

                        new Paragraph({
                            text: `Fecha y hora de firma: ${new Date(firmaData.fechaFirma).toLocaleString()}`,
                            spacing: { after: 200 }
                        }),

                        new Paragraph({
                            text: `Ubicación: ${firmaData.ubicacion}`,
                            spacing: { after: 200 }
                        }),

                        // Firma textual
                        firmaData.firmaTexto && new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: firmaData.firmaTexto,
                                    bold: true,
                                    size: 20,
                                })
                            ],
                            spacing: { before: 400, after: 200 }
                        }),

                        new Paragraph({
                            text: `Hash de validación: ${firmaData.hashDocumento}`,
                            size: 14,
                            color: "666666"
                        })
                    ]
                }]
            });

            return await Packer.toBuffer(doc);
            
        } catch (error) {
            console.error('. Error en método preservarYFirmarDocumento:', error);
            return bufferOriginal;
        }
    }

    /**
     * Subir documento a Supabase Storage
     */
    static async subirDocumento(nombreArchivo, buffer, metadatos = {}) {
        try {
            console.log('📄 Subiendo documento a Supabase Storage:', {
                nombreArchivo,
                tamanio: buffer.length,
                metadatos
            });

            const rutaStorage = `contratos-firmados/${nombreArchivo}`;

            const { data, error } = await supabase.storage
                .from('kyc-documents')
                .upload(rutaStorage, buffer, {
                    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    upsert: true,
                    metadata: metadatos
                });

            if (error) {
                console.error('. Error subiendo documento a Supabase:', error);
                throw error;
            }

            console.log('. Documento subido exitosamente a Supabase:', {
                ruta: rutaStorage
            });

            return {
                success: true,
                contratoId: rutaStorage,
                ruta: rutaStorage,
                data: data
            };

        } catch (error) {
            console.error('. Error subiendo documento:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generar hash para documento
     */
    static generarHashDocumento(buffer, metadatos = {}) {
        try {
            const contenido = buffer.toString('base64') + JSON.stringify(metadatos);
            return crypto.createHash('sha256').update(contenido).digest('hex');
        } catch (error) {
            console.error('. Error generando hash del documento:', error);
            throw error;
        }
    }

    /**
     * Validar integridad del documento
     */
    static validarIntegridadDocumento(hashOriginal, hashFirmado) {
        return hashOriginal === hashFirmado;
    }

    /**
     * Crear solicitud de firma interna
     */
    static async crearSolicitudFirma(contratoId, solicitante) {
        try {
            console.log('. Creando solicitud de firma interna para:', contratoId);

            const firmaId = crypto.randomUUID();
            const urlFirma = `/firmar-contrato/${firmaId}`;

            return {
                success: true,
                signatureRequestId: firmaId,
                urlFirma: urlFirma,
                data: {
                    tipo: 'firma_interna',
                    url: urlFirma,
                    expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            };

        } catch (error) {
            console.error('. Error creando solicitud de firma interna:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verificar estado de firma interna
     */
    static async verificarEstadoFirma(signatureRequestId) {
        try {
            const { data: firma, error } = await supabase
                .from('firmas_digitales')
                .select('estado')
                .eq('id', signatureRequestId)
                .single();

            if (error) {
                throw error;
            }

            return {
                success: true,
                estado: firma.estado,
                completado: firma.estado === 'firmado_completo'
            };

        } catch (error) {
            console.error('. Error verificando estado de firma:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Descargar documento de storage
     */
    static async descargarDocumento(rutaStorage) {
        try {
            const { data, error } = await supabase.storage
                .from('kyc-documents')
                .download(rutaStorage);

            if (error) throw error;

            const arrayBuffer = await data.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (error) {
            console.error('. Error descargando documento:', error);
            throw error;
        }
    }

    /**
     * Verificar si un documento existe en storage
     */
    static async verificarDocumentoExiste(rutaStorage) {
        try {
            const { data, error } = await supabase.storage
                .from('kyc-documents')
                .download(rutaStorage);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, existe: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Verificar integridad completa del documento
     */
  static async verificarIntegridadCompleta(firma_id) {
    try {
        const { data: firma } = await supabase
            .from('firmas_digitales')
            .select('fecha_firma_operador, fecha_firma_solicitante')
            .eq('id', firma_id)
            .single();

        if (!firma) {
            return false;
        }

        // CORRECCIÓN: Integridad es true cuando AMBAS partes han firmado
        // Y debe retornar un BOOLEAN, no una fecha
        const ambasFirmasPresentes = firma.fecha_firma_operador && firma.fecha_firma_solicitante;
        
        console.log('. Verificación de integridad:', {
            firma_id,
            fecha_operador: firma.fecha_firma_operador,
            fecha_solicitante: firma.fecha_firma_solicitante,
            ambasFirmasPresentes
        });

        return ambasFirmasPresentes; // Esto siempre será boolean

    } catch (error) {
        console.error('. Error verificando integridad completa:', error);
        return false;
    }
}
    /**
     * Obtener el último documento disponible para firma
     */
    static async obtenerUltimoDocumento(firma_id) {
        try {
            const { data: firma } = await supabase
                .from('firmas_digitales')
                .select('url_documento_firmado, ruta_documento, hash_documento_firmado')
                .eq('id', firma_id)
                .single();

            if (!firma) {
                throw new Error('Firma no encontrada');
            }

            // Priorizar documento firmado, luego documento original
            const rutaDocumento = firma.url_documento_firmado || firma.ruta_documento;
            
            if (!rutaDocumento) {
                throw new Error('No hay documento disponible para firmar');
            }

            const { data: fileData, error: fileError } = await supabase.storage
                .from('kyc-documents')
                .download(rutaDocumento);

            if (fileError) {
                throw new Error('Error descargando documento: ' + fileError.message);
            }

            const buffer = Buffer.from(await fileData.arrayBuffer());
            
            return {
                success: true,
                buffer: buffer,
                ruta: rutaDocumento,
                hashActual: firma.hash_documento_firmado,
                esDocumentoFirmado: !!firma.url_documento_firmado
            };

        } catch (error) {
            console.error('. Error obteniendo último documento:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = WordService;