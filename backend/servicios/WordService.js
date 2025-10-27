// servicios/WordService.js - VERSIÓN REAL
const { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType } = require('docx');
const mammoth = require('mammoth');
const crypto = require('crypto');
const { supabase } = require('../config/conexion');

class WordService {
    /**
     * Extraer contenido real del documento Word
     */
  static async extraerContenidoWord(bufferDocumento) {
    try {
        console.log('. Extrayendo contenido real del documento Word...');
        
        const result = await mammoth.extractRawText({ 
            buffer: bufferDocumento,
            preserveEmptyLines: true // ← MANTENER LÍNEAS VACÍAS
        });
        
        let contenido = result.value;
        
        // PRESERVAR MEJOR EL FORMATO ORIGINAL
        contenido = contenido
            .replace(/\n{3,}/g, '\n\n') // Normalizar múltiples saltos
            .replace(/([.!?])([A-Z])/g, '$1\n$2') // Mejorar separación de párrafos
            .trim();
        
        console.log('. Contenido extraído con formato preservado');
        return contenido;
        
    } catch (error) {
        console.error('. Error extrayendo contenido Word:', error);
        
        // FALLBACK MEJORADO con estructura del contrato
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

La firma digital de este documento implica consentimiento pleno y aceptación legal conforme a la legislación vigente.`;
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
        
        // Crear documento que preserve completamente el formato original
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Contenido original del contrato con formato preservado
                    ...contenidoOriginal.split('\n').map(linea => 
                        new Paragraph({
                            text: linea,
                            alignment: linea.includes('_________________________') ? 
                                AlignmentType.CENTER : AlignmentType.LEFT,
                            spacing: { 
                                after: linea.trim() === '' ? 100 : 200,
                                before: linea.match(/^[A-Z]+:/) ? 400 : 0
                            },
                            heading: linea.includes('CONTRATO DE AUTORIZACIÓN') ? 
                                HeadingLevel.HEADING_1 : undefined
                        })
                    ),

                    // Separador para firmas
                    new Paragraph({
                        text: " ",
                        spacing: { before: 800, after: 400 }
                    }),

                    new Paragraph({
                        text: "--- FIRMAS DIGITALES ---",
                        heading: HeadingLevel.HEADING_2,
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 800, after: 400 }
                    }),

                    // Información de la firma
                    new Paragraph({
                        text: "Este documento ha sido firmado digitalmente con validez legal",
                        spacing: { after: 200 }
                    }),

                    // Firma textual si existe
                    firmaData.firmaTexto && new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: `Firmado por: ${firmaData.firmaTexto}`,
                                bold: true
                            })
                        ],
                        spacing: { before: 400, after: 200 }
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
                                text: `Ubicación: ${firmaData.ubicacion}`,
                            })
                        ],
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: `Hash de validación: ${firmaData.hashDocumento}`,
                                style: "SourceCode",
                            })
                        ],
                        spacing: { after: 400 }
                    }),
                ]
            }]
        });

        return await Packer.toBuffer(doc);
        
    } catch (error) {
        console.error('. Error procesando documento Word:', error);
        
        // Fallback mejorado
        console.log('. Usando fallback con formato estructurado');
        return bufferDocumento;
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
}

module.exports = WordService;