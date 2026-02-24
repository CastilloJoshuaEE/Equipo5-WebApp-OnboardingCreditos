// backend/application/use-cases/notificaciones/NotificarRechazoFirma.js
const Notificacion = require('../../../domain/entities/Notificacion');

class NotificarRechazoFirma {
  constructor(notificacionRepository, supabase) {
    this.notificacionRepository = notificacionRepository;
    this.supabase = supabase;
  }

  async execute(contratoId) {
    const { data: contrato } = await this.supabase
      .from('contratos')
      .select(`
        *,
        solicitudes_credito(
          solicitante_id,
          operador_id
        )
      `)
      .eq('id', contratoId)
      .single();

    if (contrato && contrato.solicitudes_credito) {
      const solicitud = contrato.solicitudes_credito;

      const notificacion = new Notificacion({
        usuario_id: solicitud.operador_id,
        tipo: Notificacion.TIPOS.FIRMA_RECHAZADA,
        titulo: 'Firma Digital Rechazada',
        mensaje: 'El solicitante ha rechazado la firma digital del contrato.',
        leida: false
      });

      const notificacionCreada = await this.notificacionRepository.crear(notificacion.toJSON());

      return {
        success: true,
        data: notificacionCreada
      };
    }

    return {
      success: false,
      message: 'No se pudo encontrar el contrato o la solicitud asociada'
    };
  }
}

module.exports = NotificarRechazoFirma;