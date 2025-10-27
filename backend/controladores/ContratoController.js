
const SolicitudModel=require('../modelos/SolicitudModel');
const DocumentoModel=require('../modelos/DocumentoModel');
const VerificacionKycModel = require('../modelos/VerificacionKycModel');
const OperadorController=require('../controladores/OperadorController')
const NotificacionService = require('../servicios/NotificacionService');
const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

const { supabase } = require('../config/conexion');
const { supabaseAdmin } = require('../config/supabaseAdmin');
const diditService = require('../servicios/diditService');
class ContratoController {
static async crearDOCXContrato(solicitud) {
    try {
        
        // Crear el documento Word
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Título
                    new Paragraph({
                        text: "CONTRATO DE AUTORIZACIÓN DE GESTIÓN DE CRÉDITO Y SERVICIOS DE ASESORÍA FINANCIERA",
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),

                    // Entre partes
                    new Paragraph({
                        children: [
                            new TextRun("Entre: "),
                            new TextRun({
                                text: "NEXIA S.A., con domicilio en Argentina, legalmente representada por Ramiro Rodriguez, en adelante \"NEXIA\",",
                                bold: true
                            })
                        ]
                    }),

                    new Paragraph({
                        children: [
                            new TextRun("y "),
                            new TextRun({
                                text: `${solicitud.solicitantes?.usuarios?.nombre_completo || 'N/A'}, portador/a del DNI N.º ${solicitud.solicitantes?.usuarios?.dni || 'N/A'}, con domicilio en ${solicitud.solicitantes?.domicilio || 'N/A'}, en adelante \"EL SOLICITANTE\",`,
                                bold: true
                            })
                        ]
                    }),

                    new Paragraph({
                        text: "se celebra el presente Contrato de Autorización, conforme a las siguientes cláusulas:",
                        spacing: { after: 400 }
                    }),

                    // PRIMERA: OBJETO
                    new Paragraph({
                        text: "PRIMERA: OBJETO",
                        heading: HeadingLevel.HEADING_2
                    }),
                    new Paragraph({
                        text: "El presente contrato tiene por objeto autorizar a NEXIA a gestionar, tramitar y/o intermediar en nombre de EL SOLICITANTE las solicitudes de crédito ante las instituciones financieras con las cuales mantiene convenios o relaciones comerciales, con el fin de facilitar el acceso a productos financieros acordes al perfil crediticio del solicitante.",
                        spacing: { after: 400 }
                    }),

                    // SEGUNDA: ALCANCE DE LA AUTORIZACIÓN
                    new Paragraph({
                        text: "SEGUNDA: ALCANCE DE LA AUTORIZACIÓN",
                        heading: HeadingLevel.HEADING_2
                    }),
                    new Paragraph({
                        text: "EL SOLICITANTE autoriza expresamente a NEXIA a:"
                    }),
                    new Paragraph({
                        text: "1. Consultar su información crediticia ante burós y entidades financieras autorizadas.",
                        indent: { left: 720 }
                    }),
                    new Paragraph({
                        text: "2. Gestionar documentos, formularios y requisitos necesarios para la tramitación de crédito.",
                        indent: { left: 720 }
                    }),
                    new Paragraph({
                        text: "3. Comunicarle resultados, observaciones o requerimientos derivados del proceso de solicitud.",
                        indent: { left: 720 },
                        spacing: { after: 400 }
                    }),

                    // TERCERA: CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS
                    new Paragraph({
                        text: "TERCERA: CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS",
                        heading: HeadingLevel.HEADING_2
                    }),
                    new Paragraph({
                        text: "NEXIA se compromete a tratar toda la información personal y financiera de EL SOLICITANTE conforme a las leyes de protección de datos personales vigentes, garantizando su confidencialidad y uso exclusivo para los fines de este contrato.",
                        spacing: { after: 400 }
                    }),

                    // CUARTA: VIGENCIA
                    new Paragraph({
                        text: "CUARTA: VIGENCIA",
                        heading: HeadingLevel.HEADING_2
                    }),
                    new Paragraph({
                        text: "El presente contrato entrará en vigor a partir de la fecha de firma digital y tendrá una vigencia de seis (6) meses, pudiendo renovarse automáticamente si las partes así lo acuerdan.",
                        spacing: { after: 400 }
                    }),

                    // QUINTA: NO GARANTÍA DE APROBACIÓN
                    new Paragraph({
                        text: "QUINTA: NO GARANTÍA DE APROBACIÓN",
                        heading: HeadingLevel.HEADING_2
                    }),
                    new Paragraph({
                        text: "EL SOLICITANTE reconoce que la aprobación del crédito depende exclusivamente de las políticas de las instituciones financieras, y que NEXIA actúa únicamente como intermediario o asesor.",
                        spacing: { after: 400 }
                    }),

                    // SEXTA: ACEPTACIÓN Y FIRMA DIGITAL
                    new Paragraph({
                        text: "SEXTA: ACEPTACIÓN Y FIRMA DIGITAL",
                        heading: HeadingLevel.HEADING_2
                    }),
                    new Paragraph({
                        text: "Ambas partes aceptan los términos de este contrato. EL SOLICITANTE declara haber leído y comprendido todas las cláusulas."
                    }),
                    new Paragraph({
                        text: "La firma digital de este documento implica consentimiento pleno y aceptación legal conforme a la legislación vigente.",
                        spacing: { after: 400 }
                    }),

                    // Información específica
                    new Paragraph({
                        text: `Fecha de aprobación de solicitud: ${new Date().toLocaleDateString()}`
                    }),
                    new Paragraph({
                        text: `Nombre del solicitante: ${solicitud.solicitantes?.usuarios?.nombre_completo || 'N/A'}`
                    }),
                    new Paragraph({
                        text: `DNI: ${solicitud.solicitantes?.usuarios?.dni || 'N/A'}`
                    }),
                    new Paragraph({
                        text: `Correo electrónico: ${solicitud.solicitantes?.usuarios?.email || 'N/A'}`
                    }),
                    new Paragraph({
                        text: "Firma digital del solicitante: ___________________________",
                        spacing: { after: 400 }
                    }),

                    // Por NEXIA
                    new Paragraph({
                        text: "Por NEXIA S.A."
                    }),
                    new Paragraph({
                        text: `Representante legal: ${solicitud.operadores?.usuarios?.nombre_completo || 'Operador del Sistema'}`
                    }),
                    new Paragraph({
                        text: "Cargo: Analista de Créditos"
                    }),
                    new Paragraph({
                        text: "Firma digital: ___________________________"
                    }),
                    new Paragraph({
                        text: `Fecha: ${new Date().toLocaleDateString()}`,
                        spacing: { after: 400 }
                    }),

                    // Pie de página
                    new Paragraph({
                        text: "*Este documento ha sido firmado digitalmente y tiene validez legal conforme a la legislación vigente.",
                        size: 16
                    })
                ]
            }]
        });

        // Exportar a buffer
        const { Packer } = require('docx');
        const buffer = await Packer.toBuffer(doc);
        return buffer;

    } catch (error) {
        console.error('Error generando DOCX del contrato:', error);
        // Fallback a contenido básico
        const contenido = `
CONTRATO DE AUTORIZACIÓN DE GESTIÓN DE CRÉDITO Y SERVICIOS DE ASESORÍA FINANCIERA

Entre:
NEXIA S.A., con domicilio en Argentina, legalmente representada por Ramiro Rodriguez, en adelante "NEXIA",

y
${solicitud.solicitantes?.usuarios?.nombre_completo || 'N/A'}, portador/a del DNI N.º ${solicitud.solicitantes?.usuarios?.dni || 'N/A'}, con domicilio en ${solicitud.solicitantes?.domicilio || 'N/A'}, en adelante "EL SOLICITANTE",

${solicitud.solicitantes?.nombre_empresa ? `EMPRESA: ${solicitud.solicitantes.nombre_empresa}` : ''}
${solicitud.solicitantes?.cuit ? `CUIT: ${solicitud.solicitantes.cuit}` : ''}

MONTO: $${solicitud.monto}
PLAZO: ${solicitud.plazo_meses} meses

Fecha: ${new Date().toLocaleDateString()}

Este documento constituye un contrato legalmente vinculante conforme a la legislación vigente.
        `;
        return Buffer.from(contenido);
    }
}
// En ContratoController.js - modificar el método generarContratoParaSolicitud
static async generarContratoParaSolicitud(solicitudId) {
    try {
        const { data: solicitud, error } = await supabaseAdmin // ← Usar Admin
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
            .eq('id', solicitudId)
            .eq('estado', 'aprobado')
            .single();

        if (error || !solicitud) {
            throw new Error('Solicitud no encontrada o no aprobada');
        }

        // Generar número de contrato único
        const numeroContrato = `CONTR-${solicitud.numero_solicitud}-${Date.now()}`;

        // Datos del contrato
        const contratoData = {
            solicitud_id: solicitudId,
            numero_contrato: numeroContrato,
            monto_aprobado: solicitud.monto,
            tasa_interes: 24.50,
            plazo_meses: solicitud.plazo_meses,
            estado: 'generado',
            tipo: 'credito_standard',
            created_at: new Date().toISOString()
        };

        // USAR supabaseAdmin PARA INSERTAR ← Esto evita RLS
        const { data: contrato, error: contratoError } = await supabaseAdmin
            .from('contratos')
            .insert([contratoData])
            .select()
            .single();

        if (contratoError) throw contratoError;

        // Generar Word del contrato
        await ContratoController.generarWordContrato(contrato.id, solicitud);

        console.log('. Contrato generado para solicitud:', solicitudId);
        return contrato;

    } catch (error) {
        console.error('. Error generando contrato:', error);
        throw error;
    }
}
static async generarWordContrato(contratoId, solicitud) {
    try {
        console.log('📄 Generando word para contrato:', contratoId);

        const pdfBuffer = await ContratoController.crearDOCXContrato(solicitud);
        
        // Subir a Supabase Storage
        const nombreArchivo = `contrato-${contratoId}.docx`;
        const rutaStorage = `contratos/${nombreArchivo}`;

        const { error: uploadError } = await supabase.storage
            .from('kyc-documents')
            .upload(rutaStorage, pdfBuffer, {
                contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                upsert: true
            });

        if (uploadError) throw uploadError;

        // Actualizar contrato con ruta del word
        const { error: updateError } = await supabase
            .from('contratos')
            .update({ 
                ruta_documento: rutaStorage,
                updated_at: new Date().toISOString()
            })
            .eq('id', contratoId);

        if (updateError) throw updateError;

        console.log('. word de contrato generado y guardado:', rutaStorage);
        return rutaStorage;

    } catch (error) {
        console.error('. Error generando word del contrato:', error);
        throw error;
    }
}
/**
 * Verificar estado del contrato antes de firma
 */
static async verificarEstadoContrato(req, res) {
    try {
        const { firma_id } = req.params;

        console.log('. Verificando estado del contrato para firma:', firma_id);

        // Consulta optimizada solo para verificar el contrato
        const { data: firma, error } = await supabase
            .from('firmas_digitales')
            .select(`
                id,
                estado,
                contratos!inner(
                    ruta_documento,
                    estado
                )
            `)
            .eq('id', firma_id)
            .single();

        if (error || !firma) {
            return res.status(404).json({
                success: false,
                message: 'Proceso de firma no encontrado'
            });
        }

        res.json({
            success: true,
            data: {
                firma_id: firma.id,
                estado_firma: firma.estado,
                contrato_valido: !!firma.contratos?.ruta_documento,
                ruta_documento: firma.contratos?.ruta_documento,
                estado_contrato: firma.contratos?.estado
            }
        });

    } catch (error) {
        console.error('. Error verificando estado del contrato:', error);
        res.status(500).json({
            success: false,
            message: 'Error verificando estado del contrato'
        });
    }
}
// En tu ContratoController.js
static async obtenerContenidoContrato(req, res) {
    try {
        const { firma_id } = req.params;

        const { data: firma, error } = await supabase
            .from('firmas_digitales')
            .select(`
                id,
                ruta_documento,
                contratos!inner(
                    ruta_documento,
                    solicitud_id
                )
            `)
            .eq('id', firma_id)
            .single();

        if (error || !firma) {
            return res.status(404).json({
                success: false,
                message: 'Proceso de firma no encontrado'
            });
        }

        // Descargar el documento
        const { data: fileData, error: fileError } = await supabase.storage
            .from('kyc-documents')
            .download(firma.ruta_documento || firma.contratos.ruta_documento);

        if (fileError) {
            throw new Error('No se pudo acceder al documento');
        }

        const buffer = Buffer.from(await fileData.arrayBuffer());
        
        // Para Word documents, podrías usar una librería como mammoth para extraer texto
        // Por ahora devolvemos información básica
        res.json({
            success: true,
            data: {
                nombre: firma.ruta_documento?.split('/').pop() || 'contrato.docx',
                tipo: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                tamanio: buffer.length,
                informacion: 'Documento Word listo para firma digital'
            }
        });

    } catch (error) {
        console.error('. Error obteniendo contenido del contrato:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo contenido del contrato'
        });
    }
}
}
module.exports = ContratoController;
