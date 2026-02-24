// backend/application/use-cases/documentos/VerDocumento.js
class VerDocumento {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async execute(tipo, id, usuario) {
    console.log(`Vista previa de documento: ${tipo} - ${id}`);

    let rutaDocumento;
    let nombreDocumento;

    if (tipo === 'contrato') {
      const { data: contrato } = await this.supabase
        .from('contratos')
        .select(`
          *,
          solicitudes_credito(
            solicitante_id,
            operador_id
          )
        `)
        .eq('id', id)
        .single();

      if (!contrato) {
        return {
          success: false,
          status: 404,
          message: 'Contrato no encontrado'
        };
      }

      const solicitud = contrato.solicitudes_credito;
      if (usuario.rol === 'solicitante' && solicitud.solicitante_id !== usuario.id) {
        return {
          success: false,
          status: 403,
          message: 'No tienes permisos para ver este documento'
        };
      }

      rutaDocumento = contrato.ruta_documento;
      nombreDocumento = `contrato-${contrato.numero_contrato}`;
    } else if (tipo === 'comprobante') {
      const { data: transferencia } = await this.supabase
        .from('transferencias_bancarias')
        .select(`
          *,
          solicitudes_credito(
            solicitante_id,
            operador_id
          )
        `)
        .eq('id', id)
        .single();

      if (!transferencia) {
        return {
          success: false,
          status: 404,
          message: 'Transferencia no encontrada'
        };
      }

      const solicitud = transferencia.solicitudes_credito;
      if (usuario.rol === 'solicitante' && solicitud.solicitante_id !== usuario.id) {
        return {
          success: false,
          status: 403,
          message: 'No tienes permisos para ver este documento'
        };
      }

      rutaDocumento = transferencia.ruta_comprobante;
      nombreDocumento = `comprobante-${transferencia.numero_comprobante}`;
    } else {
      return {
        success: false,
        status: 400,
        message: 'Tipo de documento no válido'
      };
    }

    if (!rutaDocumento) {
      return {
        success: false,
        status: 404,
        message: 'Documento no disponible'
      };
    }

    const { data: urlData } = this.supabase.storage
      .from('kyc-documents')
      .getPublicUrl(rutaDocumento);

    return {
      success: true,
      data: {
        url: urlData.publicUrl,
        nombre: nombreDocumento,
        tipo: tipo
      }
    };
  }
}

module.exports = VerDocumento;