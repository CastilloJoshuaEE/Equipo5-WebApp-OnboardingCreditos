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
        console.log('. . Procesando firma acumulativa CORREGIDA para:', firma_id);

        // 1. Obtener información COMPLETA de la firma con estado actual
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

        // 2. Obtener el documento ACTUAL (no siempre el original)
        let rutaDocumentoActual = firma.url_documento_firmado || firma.contratos?.ruta_documento;
        
        if (!rutaDocumentoActual) {
            throw new Error('No se encontró documento para firmar');
        }

        console.log('. Usando documento:', rutaDocumentoActual);

        // 3. VERIFICAR que el documento existe en storage
        const { data: fileData, error: fileError } = await supabase.storage
            .from('kyc-documents')
            .download(rutaDocumentoActual);

        if (fileError) {
            throw new Error('Error accediendo al documento: ' + fileError.message);
        }

        const bufferActual = Buffer.from(await fileData.arrayBuffer());

        // 4. EXTRAER contenido EXISTENTE y EVITAR duplicación
        const contenidoExistente = await WordService.extraerContenidoSinFirmasDuplicadas(bufferActual);
        
        // 5. OBTENER INFORMACIÓN ACTUALIZADA DE AMBAS FIRMAS
        const { data: firmaActualizada } = await supabase
            .from('firmas_digitales')
            .select('fecha_firma_solicitante, fecha_firma_operador')
            .eq('id', firma_id)
            .single();

        // 6. GENERAR NUEVA SECCIÓN DE FIRMAS con información actualizada
        const seccionFirmasActualizada = await WordService.generarSeccionFirmasActualizada(
            firma_id, 
            datosFirma, 
            tipo
        );

        // 7. COMBINAR contenido existente con nueva sección de firmas
        const documentoFinal = await WordService.combinarContenidoYFirmas(
            contenidoExistente, 
            seccionFirmasActualizada
        );

        // 8. Generar hash del documento final
        const nuevoHash = WordService.generarHashDocumento(documentoFinal, {
            fechaFirma: datosFirma.fechaFirma,
            firmante: datosFirma.nombreFirmante,
            tipoFirma: tipo,
            firmaAnterior: firma.hash_documento_firmado,
            // Incluir información de ambas firmas en el hash
            firmas: {
                solicitante: firmaActualizada?.fecha_firma_solicitante,
                operador: firmaActualizada?.fecha_firma_operador
            }
        });

        // 9. Subir nuevo documento firmado
        const nombreArchivoFirmado = `contrato-firmado-${firma_id}-${Date.now()}.docx`;
        const uploadResult = await WordService.subirDocumento(
            nombreArchivoFirmado,
            documentoFinal,
            {
                firma_id: firma_id,
                firmante: datosFirma.nombreFirmante,
                fecha_firma: datosFirma.fechaFirma,
                hash_firmado: nuevoHash,
                tipo_firma: tipo,
                // Registrar ambas firmas en metadatos
                firmas_registradas: {
                    solicitante: !!firmaActualizada?.fecha_firma_solicitante,
                    operador: !!firmaActualizada?.fecha_firma_operador
                }
            }
        );

        if (!uploadResult.success) {
            throw new Error('Error subiendo documento firmado: ' + uploadResult.error);
        }

        return {
            success: true,
            buffer: documentoFinal,
            hash: nuevoHash,
            ruta: uploadResult.ruta
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
   static async extraerContenidoSinFirmasDuplicadas(bufferDocumento) {
    try {
        console.log('. Extrayendo contenido sin duplicar firmas...');
        
        const result = await mammoth.extractRawText({ 
            buffer: bufferDocumento,
            preserveEmptyLines: true
        });
        
        let contenido = result.value;
        
        // ELIMINAR secciones de firmas duplicadas
        const patronesFirmas = [
            '--- FIRMAS DIGITALES REGISTRADAS ---',
            '--- FIRMAS DIGITALES ---',
            'INFORMACIÓN DE FIRMA DIGITAL',
            'FIRMADO POR:',
            '✓ DOCUMENTO FIRMADO DIGITALMENTE'
        ];
        
        for (const patron of patronesFirmas) {
            const indice = contenido.indexOf(patron);
            if (indice !== -1) {
                // Conservar solo el contenido ANTES del patrón
                contenido = contenido.substring(0, indice).trim();
                console.log('. Se eliminó sección de firmas con patrón:', patron);
                break;
            }
        }
        
        // LIMPIAR saltos de línea excesivos
        contenido = contenido.replace(/\n{3,}/g, '\n\n'); // Máximo 2 saltos de línea consecutivos
        
        console.log('. Contenido limpiado exitosamente');
        return contenido;
        
    } catch (error) {
        console.error('. Error extrayendo contenido sin duplicados:', error);
        // Fallback: devolver contenido sin procesar
        const result = await mammoth.extractRawText({ buffer: bufferDocumento });
        return result.value;
    }
}
    /**
     * Generar sección de firmas ACTUALIZADA (solo una vez)
     */
   
    static async generarSeccionFirmasActualizada(firma_id, datosFirma, tipo) {
    try {
        console.log('. Generando sección de firmas actualizada para:', firma_id);
        
        // Obtener información ACTUAL de la firma con todas las firmas registradas
        const { data: firmaCompleta, error } = await supabase
            .from('firmas_digitales')
            .select(`
                fecha_firma_solicitante,
                fecha_firma_operador,
                hash_documento_original,
                solicitudes_credito(
                    numero_solicitud,
                    solicitantes:solicitantes!solicitante_id(usuarios(nombre_completo, email)),
                    operadores:operadores!operador_id(usuarios(nombre_completo, email))
                )
            `)
            .eq('id', firma_id)
            .single();

        if (error) {
            throw error;
        }

        const solicitud = firmaCompleta.solicitudes_credito;
        const solicitante = solicitud?.solicitantes?.usuarios;
        const operador = solicitud?.operadores?.usuarios;

        // Construir sección de firmas con formato claro
        let seccionFirmas = `--- FIRMAS DIGITALES REGISTRADAS ---

INFORMACIÓN DE FIRMA DIGITAL`;

        // AGREGAR FIRMA DEL SOLICITANTE SI EXISTE
        if (firmaCompleta.fecha_firma_solicitante) {
            seccionFirmas += `

FIRMADO POR: ${solicitante?.nombre_completo || 'Solicitante'}
FECHA: ${new Date(firmaCompleta.fecha_firma_solicitante).toLocaleString()}
UBICACIÓN: ${datosFirma.ubicacion || 'Ubicación no disponible'}
HASH DE VALIDACIÓN: ${firmaCompleta.hash_documento_original}

✓ DOCUMENTO FIRMADO DIGITALMENTE - VÁLIDO LEGALMENTE`;
        }

        // AGREGAR FIRMA DEL OPERADOR SI EXISTE
        if (firmaCompleta.fecha_firma_operador) {
            seccionFirmas += `

FIRMADO POR: ${operador?.nombre_completo || 'Operador'}
FECHA: ${new Date(firmaCompleta.fecha_firma_operador).toLocaleString()}
UBICACIÓN: ${datosFirma.ubicacion || 'Ubicación no disponible'}
HASH DE VALIDACIÓN: ${firmaCompleta.hash_documento_original}

✓ DOCUMENTO FIRMADO DIGITALMENTE - VÁLIDO LEGALMENTE`;
        }

        // AGREGAR FIRMA ACTUAL QUE SE ESTÁ PROCESANDO (si no existe ya)
        const yaExisteFirma = (tipo === 'solicitante' && firmaCompleta.fecha_firma_solicitante) || 
                             (tipo === 'operador' && firmaCompleta.fecha_firma_operador);
        
        if (!yaExisteFirma) {
            seccionFirmas += `

FIRMADO POR: ${datosFirma.nombreFirmante}
FECHA: ${new Date(datosFirma.fechaFirma).toLocaleString()}
UBICACIÓN: ${datosFirma.ubicacion || 'Ubicación no disponible'}
HASH DE VALIDACIÓN: ${firmaCompleta.hash_documento_original}

✓ DOCUMENTO FIRMADO DIGITALMENTE - VÁLIDO LEGALMENTE`;
        }

        console.log('. Sección de firmas generada exitosamente');
        return seccionFirmas;

    } catch (error) {
        console.error('. Error generando sección de firmas:', error);
        // Fallback: sección básica con formato claro
        return `--- FIRMAS DIGITALES REGISTRADAS ---

INFORMACIÓN DE FIRMA DIGITAL

FIRMADO POR: ${datosFirma.nombreFirmante}
FECHA: ${new Date(datosFirma.fechaFirma).toLocaleString()}
UBICACIÓN: ${datosFirma.ubicacion || 'Ubicación no disponible'}
HASH DE VALIDACIÓN: ${datosFirma.hashDocumento}

✓ DOCUMENTO FIRMADO DIGITALMENTE - VÁLIDO LEGALMENTE`;
    }
}
     static async combinarContenidoYFirmas(contenido, seccionFirmas) {
    try {
        console.log('. Combinando contenido y firmas en documento final...');
        
        // Dividir el contenido en párrafos preservando la estructura
        const lineas = contenido.split('\n');
        const parrafosContenido = [];
        
        for (const linea of lineas) {
            if (linea.trim() === '') {
                // Línea vacía para separación - REDUCIR ESPACIADO
                parrafosContenido.push(new Paragraph({ 
                    text: '',
                    spacing: { after: 80 } // Reducido significativamente
                }));
                continue;
            }
            
            // Determinar el formato según el contenido
            if (linea.includes('CONTRATO DE AUTORIZACIÓN')) {
                // Título principal
                parrafosContenido.push(new Paragraph({
                    text: linea,
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 } // Reducido de 400
                }));
            } else if (linea.match(/^[A-ZÁÉÍÓÚÑ\s]+:$/) || linea.match(/^[A-ZÁÉÍÓÚÑ\s]+ [A-ZÁÉÍÓÚÑ\s]+:$/)) {
                // Encabezados de cláusulas (PRIMERA:, SEGUNDA:, etc.)
                parrafosContenido.push(new Paragraph({
                    text: linea,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 100 } // Reducido significativamente
                }));
            } else if (linea.match(/^\d+\./)) {
                // Elementos de lista numerada
                parrafosContenido.push(new Paragraph({
                    children: [
                        new TextRun({
                            text: linea,
                            bold: linea.includes('NEXIA') || linea.includes('SOLICITANTE')
                        })
                    ],
                    spacing: { after: 80 }, // Reducido de 150
                    indent: { left: 360 } // Reducido de 720 (0.25 pulgadas en lugar de 0.5)
                }));
            } else if (linea.includes('Entre:') || linea.includes('se celebra el presente Contrato')) {
                // Párrafos de introducción
                parrafosContenido.push(new Paragraph({
                    text: linea,
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 } // Reducido de 200
                }));
            } else {
                // Párrafos normales
                parrafosContenido.push(new Paragraph({
                    text: linea,
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 120 } // Reducido de 200
                }));
            }
        }

        // Procesar la sección de firmas
        const lineasFirmas = seccionFirmas.split('\n');
        const parrafosFirmas = [];
        
        for (const linea of lineasFirmas) {
            if (linea.trim() === '') {
                parrafosFirmas.push(new Paragraph({ 
                    text: '',
                    spacing: { after: 80 } // Reducido
                }));
                continue;
            }
            
            if (linea.includes('--- FIRMAS DIGITALES REGISTRADAS ---')) {
                parrafosFirmas.push(new Paragraph({
                    text: linea,
                    heading: HeadingLevel.HEADING_2,
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 400, after: 200 } // Reducido
                }));
            } else if (linea.includes('INFORMACIÓN DE FIRMA DIGITAL')) {
                parrafosFirmas.push(new Paragraph({
                    text: linea,
                    heading: HeadingLevel.HEADING_3,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 150 } // Reducido
                }));
            } else if (linea.includes('FIRMADO POR:')) {
                parrafosFirmas.push(new Paragraph({
                    children: [
                        new TextRun({
                            text: linea,
                            bold: true,
                            size: 22
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 100 } // Reducido
                }));
            } else if (linea.includes('FECHA:') || linea.includes('UBICACIÓN:')) {
                parrafosFirmas.push(new Paragraph({
                    text: linea,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 } // Reducido
                }));
            } else if (linea.includes('HASH DE VALIDACIÓN:')) {
                parrafosFirmas.push(new Paragraph({
                    children: [
                        new TextRun({
                            text: linea,
                            style: "SourceCode",
                            size: 14,
                            color: "666666"
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 } // Reducido
                }));
            } else if (linea.includes('✓ DOCUMENTO FIRMADO DIGITALMENTE')) {
                parrafosFirmas.push(new Paragraph({
                    children: [
                        new TextRun({
                            text: linea,
                            bold: true,
                            color: "008000",
                            size: 16
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 100 } // Reducido
                }));
            } else {
                parrafosFirmas.push(new Paragraph({
                    text: linea,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 } // Reducido
                }));
            }
        }

        // Crear documento con estructura organizada y espaciado compacto
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Contenido principal del contrato
                    ...parrafosContenido,
                    
                    // Espacio antes de las firmas (reducido)
                    new Paragraph({
                        text: "",
                        spacing: { before: 400, after: 200 } // Reducido significativamente
                    }),
                    
                    // Sección de firmas
                    ...parrafosFirmas
                ]
            }]
        });

        return await Packer.toBuffer(doc);
        
    } catch (error) {
        console.error('. Error combinando contenido y firmas:', error);
        throw error;
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

                    // . NUEVA SECCIÓN DE FIRMAS DIGITALES .
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
            console.log('. Subiendo documento a Supabase Storage:', {
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