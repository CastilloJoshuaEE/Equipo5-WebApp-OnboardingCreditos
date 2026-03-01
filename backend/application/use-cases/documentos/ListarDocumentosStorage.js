// backend/application/use-cases/documentos/ListarDocumentosStorage.js
class ListarDocumentosStorage {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async execute(solicitud_id, usuario) {

    // Verificar permisos de la solicitud
    const { data: solicitud } = await this.supabase
      .from('solicitudes_credito')
      .select('solicitante_id, operador_id')
      .eq('id', solicitud_id)
      .single();

    if (!solicitud) {
      return {
        success: false,
        status: 404,
        message: 'Solicitud no encontrada'
      };
    }

    const tienePermiso = (
      usuario.rol === 'operador' ||
      (usuario.rol === 'solicitante' && solicitud.solicitante_id === usuario.id)
    );

    if (!tienePermiso) {
      return {
        success: false,
        status: 403,
        message: 'No tienes permisos para ver estos documentos'
      };
    }

    const carpetas = ['contratos', 'contratos-firmados', 'comprobantes-transferencia', 'documentos'];
    let todosDocumentos = [];

    for (const carpeta of carpetas) {
      const { data: archivos, error } = await this.supabase.storage
        .from('kyc-documents')
        .list(carpeta, {
          limit: 100,
          offset: 0,
          search: solicitud_id
        });

      if (!error && archivos) {
        const documentosConInfo = archivos.map(archivo => ({
          nombre: archivo.name,
          carpeta: carpeta,
          ruta: `${carpeta}/${archivo.name}`,
          tamaño: archivo.metadata?.size,
          fecha_actualizacion: archivo.updated_at,
          tipo: this.obtenerTipoDocumento(archivo.name, carpeta)
        }));
        todosDocumentos = todosDocumentos.concat(documentosConInfo);
      }
    }

    // Generar URLs públicas
    const documentosConUrls = todosDocumentos.map(doc => {
      const { data: urlData } = this.supabase.storage
        .from('kyc-documents')
        .getPublicUrl(doc.ruta);

      return {
        ...doc,
        url_publica: urlData.publicUrl,
        puede_descargar: true
      };
    });

    return {
      success: true,
      data: {
        solicitud_id,
        total_documentos: documentosConUrls.length,
        documentos: documentosConUrls
      }
    };
  }

  obtenerTipoDocumento(nombreArchivo, carpeta) {
    if (nombreArchivo.includes('contrato') || carpeta.includes('contrato')) {
      return 'contrato';
    } else if (nombreArchivo.includes('comprobante') || carpeta.includes('comprobante')) {
      return 'comprobante';
    } else if (nombreArchivo.includes('firmado')) {
      return 'documento_firmado';
    } else {
      return 'documento';
    }
  }
}

module.exports = ListarDocumentosStorage;