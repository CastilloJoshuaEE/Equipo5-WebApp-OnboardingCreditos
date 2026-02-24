// backend/application/use-cases/firmas/ObtenerInfoFirma.js
class ObtenerInfoFirma{
    constructor(firmaDigitalRepository, supabase){
        this.firmaDigitalRepository = firmaDigitalRepository;
        this.supabase = supabase;
    }
    async execute(firma_id, usuario){
        console.log('Obteniendo información para firma word:', firma_id);
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
        const firma = await this.firmaDigitalRepository.obtenerInfoFirma(firma_id);
        if(!firma){
            return {
                success: false,
                status: 404,
                message: 'Proceso de firma no encontrado'
            };
        }
        const contrato = firma.contratos;
        if(!contrato){
            console.error('Contrato no encontrado para firma:', firma_id);
            try{
                const resultadoReparacion = await this.firmaDigitalRepository.repararRelacionFirmaContrato(firma_id);
                if(resultadoReparacion){
                    console.log('Relación reparada automáticamente');
                    const firmaReparada = await this.firmaDigitalRepository.obtenerInfoParaFirma(firma_id);
                    return await this.prepararRespuestaFirma(firmaReparada);
                }
            } catch(reparacionError){
                console.error('Error reparando relación:', reparacionError);
            }
            return {
                success: false,
                status: 404,
                message: 'Contrato no encontrado para este proceso de firma'
            };
        }
        if(!contrato.ruta_documento){
            console.error('Contrato sin documentos:', contrato.id);
            return {
                success: false,
                status: 404,
                message: 'El contrato no tiene documento Word generado'
            };
        }
        console.log('Contrato encontrado:', contrato.ruta_documento);
        // Obtener información del solicitante
        const { data:solicitudCompleta} = await this.supabase
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
        const datosContrato= {
            nombre_completo: solicitudCompleta?.solicitantes?.usuarios?.nombre_completo,
            dni:solicitudCompleta?.solicitantes?.usuarios?.dni,
            domicilio: solicitudCompleta?.solicitantes?.domicilio,
            nombre_empresa: solicitudCompleta?.solicitantes?.nombre_empresa,
            cuit: solicitudCompleta?.solicitantes?.cuit,
            representante_legal: solicitudCompleta?.solicitantes?.representante_legal,
            email: solicitudCompleta?.solicitantes?.usuarios?.email,
            numero_solicitud: solicitudCompleta?.numero_solicitud
        };
        console.log('Datos del contrato preparados:', datosContrato);
        // Obtener el documento word original
        const fileData = await this.obtenerDocumentoParaFirma(firma_id);
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
          solicitudes_credito: firma.solicitudes_credito || {}
        },
        documento: documentoBase64,
        nombre_documento: `contrato-${firma.solicitudes_credito?.numero_solicitud || 'sin-numero'}.docx`,
        tipo_documento: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fecha_expiracion: firma.fecha_expiracion,
        solicitante: solicitudCompleta?.solicitantes?.usuarios,
        hash_original: firma.hash_documento_original,
        datos_contrato: datosContrato
      }
    };
  }
  async obtenerDocumentoParaFirma(firmaId) {
    const firma = await this.firmaDigitalRepository.obtenerPorId(firmaId);
    if (!firma || !firma.contratos?.ruta_documento) {
      throw new Error('Documento no encontrado');
    }

    const { data: fileData, error } = await this.supabase.storage
      .from('kyc-documents')
      .download(firma.contratos.ruta_documento);

    if (error) throw error;
    return fileData;
  }

  async prepararRespuestaFirma(firma) {
    // Método auxiliar
  }
}

module.exports = ObtenerInfoFirma;