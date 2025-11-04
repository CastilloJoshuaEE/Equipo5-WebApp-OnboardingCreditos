const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const ContratoModel = require('../modelos/ContratoModel');

class ContratoController {
    
    /**
     * Generar contenido DOCX del contrato
     */
    static async crearDOCXContrato(solicitud) {
        try {
            // Obtener información de firmas usando el modelo
            let firmaSolicitante = null;
            let firmaOperador = null;
            
            let fechaSolicitante = null;
            let fechaOperador = null;
            let hashDocumento = 'Pendiente de firma';

            try {
                const firmas = await ContratoModel.obtenerInformacionFirmas(solicitud.id);
                if (firmas) {
                    fechaSolicitante = firmas.fecha_firma_solicitante ? 
                        new Date(firmas.fecha_firma_solicitante).toLocaleString() : null;
                    fechaOperador = firmas.fecha_firma_operador ? 
                        new Date(firmas.fecha_firma_operador).toLocaleString() : null;
                    hashDocumento = firmas.hash_documento_firmado || hashDocumento;
                    
                    // Determinar si hay firmas visuales
                    firmaSolicitante = firmas.fecha_firma_solicitante ? '✓ FIRMADO' : null;
                    firmaOperador = firmas.fecha_firma_operador ? '✓ FIRMADO' : null;
                }
            } catch (error) {
                console.log('No se pudo obtener información de firmas:', error.message);
            }

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
                        
                        // FIRMA DEL SOLICITANTE (si existe)
                        new Paragraph({
                            text: `Firma digital del solicitante: ${firmaSolicitante || '___________________________'}`,
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
                        
                        // FIRMA DEL OPERADOR (si existe)  
                        new Paragraph({
                            text: `Firma digital del operador: ${firmaOperador || '___________________________'}`,
                            spacing: { after: 400 }
                        }),

                        new Paragraph({
                            text: `Fecha: ${new Date().toLocaleDateString()}`,
                            spacing: { after: 400 }
                        }),

                        // Pie de página
                        new Paragraph({
                            text: "*Este documento ha sido firmado digitalmente y tiene validez legal conforme a la legislación vigente.",
                            size: 16,
                            spacing: { after: 400 }
                        }),
                    ]
                }]
            });

            // Exportar a buffer
            const { Packer } = require('docx');
            const buffer = await Packer.toBuffer(doc);
            return buffer;

        } catch (error) {
            console.error('Error generando DOCX del contrato:', error);
            throw error;
        }
    }

    /**
     * Generar contrato para solicitud
     */
   static async generarContratoParaSolicitud(solicitudId) {
    try {
        // Obtener solicitud usando el modelo
        const solicitud = await ContratoModel.obtenerSolicitudAprobada(solicitudId);

        // VERIFICAR SI YA EXISTE UN CONTRATO PARA ESTA SOLICITUD
        let contratoExistente;
        try {
            contratoExistente = await ContratoModel.obtenerPorSolicitud(solicitudId);
        } catch (error) {
            // Si hay error, asumir que no existe contrato
            console.log('. No se pudo verificar contrato existente, creando uno nuevo...');
            contratoExistente = null;
        }
        
        if (contratoExistente) {
            console.log('. Contrato existente encontrado, actualizando:', contratoExistente.id);
            
            // Actualizar contrato existente
            const numeroContrato = ContratoModel.generarNumeroContrato(solicitud.numero_solicitud);
            
            const updateData = {
                numero_contrato: numeroContrato,
                monto_aprobado: solicitud.monto,
                tasa_interes: 24.50,
                plazo_meses: solicitud.plazo_meses,
                estado: 'generado',
                updated_at: new Date().toISOString()
            };

            const contratoActualizado = await ContratoModel.actualizar(contratoExistente.id, updateData);
            
            // Generar Word del contrato actualizado
            await ContratoController.generarWordContrato(contratoActualizado.id, solicitud);

            console.log('. Contrato existente actualizado para solicitud:', solicitudId);
            return contratoActualizado;
        }

        // Si no existe, crear uno nuevo
        const numeroContrato = ContratoModel.generarNumeroContrato(solicitud.numero_solicitud);

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

        // Validar datos
        const erroresValidacion = ContratoModel.validarDatosContrato(contratoData);
        if (erroresValidacion.length > 0) {
            throw new Error(`Datos de contrato inválidos: ${erroresValidacion.join(', ')}`);
        }

        // Crear contrato usando el modelo
        const contrato = await ContratoModel.crear(contratoData);

        // Generar Word del contrato
        await ContratoController.generarWordContrato(contrato.id, solicitud);

        console.log('. Nuevo contrato generado para solicitud:', solicitudId);
        return contrato;

    } catch (error) {
        console.error('. Error generando contrato:', error);
        throw error;
    }
}
    /**
     * Generar archivo Word del contrato
     */
    static async generarWordContrato(contratoId, solicitud) {
        try {
            console.log('. Generando word para contrato:', contratoId);

            // Generar contenido DOCX
            const pdfBuffer = await ContratoController.crearDOCXContrato(solicitud);
            
            // Subir a Supabase Storage usando el modelo
            const nombreArchivo = `contrato-${contratoId}.docx`;
            const rutaStorage = `contratos/${nombreArchivo}`;

            await ContratoModel.subirDocumento(rutaStorage, pdfBuffer);

            // Actualizar contrato con ruta del word usando el modelo
            await ContratoModel.actualizarRutaDocumento(contratoId, rutaStorage);

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

            // Consultar estado usando el modelo
            const firma = await ContratoModel.verificarEstadoParaFirma(firma_id);

            if (!firma) {
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

    /**
     * Obtener contenido del contrato
     */
    static async obtenerContenidoContrato(req, res) {
        try {
            const { firma_id } = req.params;

            // Obtener información de la firma usando el modelo
            const firma = await ContratoModel.obtenerParaFirma(firma_id);

            if (!firma) {
                return res.status(404).json({
                    success: false,
                    message: 'Proceso de firma no encontrado'
                });
            }

            // Descargar el documento usando el modelo
            const fileData = await ContratoModel.descargarDocumento(
                firma.ruta_documento || firma.contratos.ruta_documento
            );

            const buffer = Buffer.from(await fileData.arrayBuffer());
            
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

    /**
     * Obtener contratos del usuario
     */
    static async obtenerContratosUsuario(req, res) {
        try {
            const usuarioId = req.usuario.id;
            const usuarioRol = req.usuario.rol;
            const { estado, tipo } = req.query;

            const filtros = {};
            if (estado) filtros.estado = estado;
            if (tipo) filtros.tipo = tipo;

            const contratos = await ContratoModel.obtenerPorUsuario(usuarioId, usuarioRol, filtros);

            res.json({
                success: true,
                data: contratos
            });

        } catch (error) {
            console.error('. Error obteniendo contratos del usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener contratos'
            });
        }
    }

    /**
     * Obtener estadísticas de contratos
     */
    static async obtenerEstadisticas(req, res) {
        try {
            const usuarioId = req.usuario.id;
            const usuarioRol = req.usuario.rol;

            const estadisticas = await ContratoModel.obtenerEstadisticas(usuarioId, usuarioRol);

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error('. Error obteniendo estadísticas de contratos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas'
            });
        }
    }
}

module.exports = ContratoController;