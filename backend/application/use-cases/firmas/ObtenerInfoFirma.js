// backend/application/use-cases/firmas/ObtenerInfoFirma.js

class ObtenerInfoFirma{
    constructor(firmaDigitalRepository, supabase){
        this.firmaDigitalRepository = firmaDigitalRepository;
        this.supabase = supabase;
    }
    async execute(firma_id, usuario){
        
        // Verificar permisos
        const tienePermisos = await this.firmaDigitalRepository.verificarPermisos(
            firma_id,
            usuario.id,
            usuario.rol
        );
        if(!tienePermisos){
            return {
                success: false,
                status: 403,
                message: 'No tiene permisos para acceder a esta firma'
            };
        }
        
        // Obtener información de la firma
        const firma = await this.firmaDigitalRepository.obtenerInfoParaFirma(firma_id);
        if(!firma){
            return {
                success: false,
                status: 404,
                message: 'Proceso de firma no encontrado'
            };
        }
        
        // Intentar obtener el documento (ya sea de la firma o del contrato)
        let fileData;
        try {
            fileData = await this.obtenerDocumentoParaFirma(firma_id);
        } catch (docError) {
            console.error('Error obteniendo documento:', docError);
            return {
                success: false,
                status: 404,
                message: 'Documento no disponible para esta firma'
            };
        }
        
        // Obtener información del solicitante (esto aún puede fallar si no hay contrato)
        let datosContrato = {};
        let solicitudCompleta = null;
        
        try {
            const { data } = await this.supabase
                .from('solicitudes_credito')
                .select(`
                    numero_solicitud,
                    solicitantes:solicitantes!solicitante_id(
                        usuarios(*),
                        nombre_empresa,
                        cuit, 
                        representante_legal,
                        domicilio
                    )
                `)
                .eq('id', firma.solicitud_id)
                .single();
            
            solicitudCompleta = data;
            
            if (solicitudCompleta) {
                datosContrato = {
                    nombre_completo: solicitudCompleta?.solicitantes?.usuarios?.nombre_completo || 'No disponible',
                    dni: solicitudCompleta?.solicitantes?.usuarios?.dni || 'No disponible',
                    domicilio: solicitudCompleta?.solicitantes?.domicilio || 'No disponible',
                    nombre_empresa: solicitudCompleta?.solicitantes?.nombre_empresa || 'No disponible',
                    cuit: solicitudCompleta?.solicitantes?.cuit || 'No disponible',
                    representante_legal: solicitudCompleta?.solicitantes?.representante_legal || 'No disponible',
                    email: solicitudCompleta?.solicitantes?.usuarios?.email || 'No disponible',
                    numero_solicitud: solicitudCompleta?.numero_solicitud || 'No disponible'
                };
            }
        } catch (error) {
            datosContrato = {
                nombre_completo: 'No disponible',
                dni: 'No disponible',
                domicilio: 'No disponible',
                nombre_empresa: 'No disponible',
                cuit: 'No disponible',
                representante_legal: 'No disponible',
                email: 'No disponible',
                numero_solicitud: 'No disponible'
            };
        }
                
        const arrayBuffer = await fileData.arrayBuffer();   
        const buffer = Buffer.from(arrayBuffer);
        const documentoBase64 = buffer.toString('base64');
        
        return {
            success: true,
            data: {
                firma: {
                    id: firma.id,
                    estado: firma.estado,
                    fecha_expiracion: firma.fecha_expiracion,
                    solicitudes_credito: solicitudCompleta || {}
                },
                documento: documentoBase64,
                nombre_documento: `contrato-${datosContrato.numero_solicitud || firma.solicitud_id}.docx`,
                tipo_documento: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                fecha_expiracion: firma.fecha_expiracion,
                solicitante: solicitudCompleta?.solicitantes?.usuarios || null,
                hash_original: firma.hash_documento_original,
                datos_contrato: datosContrato
            }
        };
    }

    async obtenerDocumentoParaFirma(firmaId) {
        const firma = await this.firmaDigitalRepository.obtenerPorId(firmaId);
        if (!firma) {
            throw new Error('Firma no encontrada');
        }

        // Priorizar los campos de la firma antes que el contrato
        let rutaDocumento = null;
        
        // Prioridad 1: Documento firmado guardado en url_documento_firmado
        if (firma.url_documento_firmado) {
            rutaDocumento = firma.url_documento_firmado;
        } 
        // Prioridad 2: ruta_documento de la firma
        else if (firma.ruta_documento) {
            rutaDocumento = firma.ruta_documento;
        }
        // Prioridad 3: Documento del contrato (solo si no hay nada en la firma)
        else if (firma.contratos?.ruta_documento) {
            rutaDocumento = firma.contratos.ruta_documento;
        }

        if (!rutaDocumento) {
            console.error('No hay documento disponible para firma:', firmaId);
            throw new Error('No hay documento disponible para esta firma');
        }


        const { data: fileData, error } = await this.supabase.storage
            .from('kyc-documents')
            .download(rutaDocumento);

        if (error) {
            console.error('Error descargando documento:', error);
            throw new Error('Error al descargar el documento');
        }
        
        return fileData;
    }

  async prepararRespuestaFirma(firma) {
    // Método auxiliar
  }
}

module.exports = ObtenerInfoFirma;