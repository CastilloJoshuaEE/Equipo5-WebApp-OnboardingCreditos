// backend/application/use-cases/solicitudes/EliminarSolicitud.js
const Solicitud = require('../../../domain/entities/Solicitud');

class EliminarSolicitud {
  constructor(solicitudRepository, supabase) {
    this.solicitudRepository = solicitudRepository;
    this.supabase = supabase;
  }

  async execute(solicitud_id, usuario) {
    try {
      // 1. Obtener la solicitud
      const solicitud = await this.solicitudRepository.findById(solicitud_id);
      
      if (!solicitud) {
        return {
          success: false,
          status: 404,
          message: 'Solicitud no encontrada'
        };
      }

      // 2. Verificar que la solicitud esté en estado borrador
      if (solicitud.estado !== 'borrador') {
        return {
          success: false,
          status: 400,
          message: 'Solo se pueden eliminar solicitudes en estado borrador'
        };
      }

      // 3. Verificar permisos
      if (usuario.rol === 'solicitante' && solicitud.solicitante_id !== usuario.id) {
        return {
          success: false,
          status: 403,
          message: 'No tienes permisos para eliminar esta solicitud'
        };
      }

      // 4. Verificar que no tenga documentos asociados o eliminarlos también
      const { data: documentos } = await this.supabase
        .from('documentos')
        .select('id, ruta_storage')
        .eq('solicitud_id', solicitud_id);

      // 5. Eliminar documentos del storage si existen
      if (documentos && documentos.length > 0) {
        for (const doc of documentos) {
          if (doc.ruta_storage) {
            try {
              await this.supabase.storage
                .from('kyc-documents')
                .remove([doc.ruta_storage]);
            } catch (storageError) {
              console.warn('Error eliminando archivo del storage:', storageError);
              // Continuamos aunque falle la eliminación del storage
            }
          }
        }

        // Eliminar registros de documentos de la BD
        await this.supabase
          .from('documentos')
          .delete()
          .eq('solicitud_id', solicitud_id);
      }

      // 6. Eliminar la solicitud
      await this.supabase
        .from('solicitudes_credito')
        .delete()
        .eq('id', solicitud_id);

      // 7. Registrar auditoría
      await this.supabase
        .from('auditoria')
        .insert({
          usuario_id: usuario.id,
          solicitud_id: solicitud_id,
          accion: 'eliminar_solicitud',
          detalle: `Solicitud en estado borrador eliminada por ${usuario.rol}`,
          created_at: new Date().toISOString()
        });

      return {
        success: true,
        message: 'Solicitud eliminada exitosamente',
        data: { solicitud_id }
      };

    } catch (error) {
      console.error('Error eliminando solicitud:', error);
      return {
        success: false,
        status: 500,
        message: 'Error al eliminar la solicitud: ' + error.message
      };
    }
  }
}

module.exports = EliminarSolicitud;