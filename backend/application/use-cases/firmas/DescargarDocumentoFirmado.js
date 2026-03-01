// backend/application/use-cases/firmas/DescargarDocumentoFirmado.js

class DescargarDocumentoFirmado {
    constructor(firmaDigitalRepository, supabase) {
        this.firmaDigitalRepository = firmaDigitalRepository;
        this.supabase = supabase;
    }

    async execute(firma_id, usuario) {
        
        // Obtener información completa de la firma
        const { data: firma, error } = await this.supabase
            .from('firmas_digitales')
            .select(`
                id,
                estado, 
                url_documento_firmado,
                ruta_documento,
                hash_documento_firmado,
                fecha_firma_completa,
                solicitud_id,
                contrato_id,
                contratos(
                    id,
                    estado, 
                    ruta_documento,
                    numero_contrato
                )
            `)
            .eq('id', firma_id)
            .single();

        if (error || !firma) {
            console.error('Error obteniendo firma:', error);
            return {
                success: false,
                status: 404,
                message: 'Proceso de firma no encontrado'
            };
        }
        
        // Verificar permisos según el rol
        if (usuario.rol === 'solicitante') {
            // Para solicitantes, verificar que sea su firma
            const { data: solicitud } = await this.supabase
                .from('solicitudes_credito')
                .select('solicitante_id')
                .eq('id', firma.solicitud_id)
                .single();
                
            if (solicitud?.solicitante_id !== usuario.id) {
                return {
                    success: false,
                    status: 403,
                    message: 'No tienes permisos para descargar este documento'
                };
            }
        }
        //  Los operadores pueden descargar cualquier documento firmado
        
        const estadosPermitidos = ['firmado_completo', 'firmado_solicitante', 'firmado_operador'];
        if (!estadosPermitidos.includes(firma.estado)) {
            return {
                success: false,
                status: 400,
                message: `El contrato no está firmado. Estado actual: ${firma.estado}`
            };
        }

        if (!firma.url_documento_firmado) {
            return {
                success: false,
                status: 404,
                message: 'Documento firmado no disponible para esta firma'
            };
        }

        const rutaDescarga = firma.url_documento_firmado;
        const nombreArchivo = `contrato-firmado-${firma.contratos?.numero_contrato || firma_id}.docx`;
                
        const { data: fileData, error: downloadError } = await this.supabase.storage
            .from('kyc-documents')
            .download(rutaDescarga);

        if (downloadError) {
            console.error('Error descargando archivo:', downloadError);
            return {
                success: false,
                status: 404,
                message: 'Error al acceder al archivo firmado: ' + downloadError.message
            };
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return {
            success: true,
            data: {
                buffer,
                nombre_archivo: nombreArchivo,
                content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
            }
        };
    }
}

module.exports = DescargarDocumentoFirmado;