// servicios/WordService.js - VERSIÓN CORREGIDA
const { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType } = require('docx');
const crypto = require('crypto');
const { supabase } = require('../config/conexion');

class WordService {
    /**
     * Agregar firma a documento Word existente
     */
    static async agregarFirmaADocumento(bufferDocumento, firmaData) {
        try {
            console.log('. Procesando firma en documento Word...');
            
            // En una implementación real, aquí usaríamos una librería como 'docx' o 'mammoth'
            // para manipular el documento Word existente
            
            // Por ahora, simulamos la adición de firma creando un nuevo documento
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            text: "DOCUMENTO CON FIRMA DIGITAL",
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.CENTER
                        }),
                        new Paragraph({
                            text: "Este documento ha sido firmado digitalmente",
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            text: `Firmado por: ${firmaData.nombreFirmante}`,
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            text: `Fecha: ${new Date(firmaData.fechaFirma).toLocaleString()}`,
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            text: `Ubicación: ${firmaData.ubicacion}`,
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            text: "--- FIRMA DIGITAL ---",
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 400, after: 400 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: firmaData.firmaTexto || "Firmado Digitalmente",
                                    bold: true,
                                    size: 24
                                })
                            ],
                            alignment: AlignmentType.CENTER
                        }),
                        new Paragraph({
                            text: `Hash de validación: ${firmaData.hashDocumento}`,
                            size: 16,
                            color: "666666"
                        })
                    ]
                }]
            });

            return await Packer.toBuffer(doc);
        } catch (error) {
            console.error('. Error procesando documento Word:', error);
            throw error;
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

            // CORRECCIÓN: Usar la variable correcta 'error' en lugar de 'uploadError'
            const { data, error } = await supabase.storage
                .from('kyc-documents')
                .upload(rutaStorage, buffer, {
                    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    upsert: true,
                    metadata: metadatos
                });

            // CORRECCIÓN: Usar 'error' en lugar de 'uploadError'
            if (error) {
                console.error('. Error subiendo documento a Supabase:', error);
                throw error;
            }

            console.log('. Documento subido exitosamente a Supabase:', {
                ruta: rutaStorage
            });

            return {
                success: true,
                contratoId: rutaStorage, // Usamos la ruta como ID
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

            // Generar URL de firma interna
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
            // Consultar estado en la base de datos
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

// CORRECCIÓN: Exportar la clase directamente para métodos estáticos
module.exports = WordService;