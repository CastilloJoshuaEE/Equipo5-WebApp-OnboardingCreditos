// backend/application/use-cases/solicitudes/CrearSolicitud.js
const Solicitud = require('../../../domain/entities/Solicitud');

class CrearSolicitud {
  constructor(solicitudRepository) {
    this.solicitudRepository = solicitudRepository;
  }

  async execute(data, usuario) {
    const {
      monto,
      plazo_meses,
      proposito,
      moneda = 'ARS'
    } = data;

    const solicitante_id = usuario.id;

    if (!monto || !plazo_meses || !proposito) {
      return {
        success: false,
        status: 400,
        message: 'Monto, plazo en meses y propósito son requeridos'
      };
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
    const numeroSolicitud = `SOL-${timestamp}-${randomStr}`;

    const solicitudEntity = new Solicitud({
      numero_solicitud: numeroSolicitud,
      solicitante_id,
      monto: parseFloat(monto),
      plazo_meses: parseInt(plazo_meses),
      proposito: proposito.trim(),
      moneda,
      estado: Solicitud.ESTADOS.BORRADOR,
      nivel_riesgo: Solicitud.NIVELES_RIESGO.MEDIO
    });

    solicitudEntity.validar();

    const solicitud = await this.solicitudRepository.create(solicitudEntity.toJSON());

    return {
      success: true,
      status: 201,
      message: 'Solicitud de crédito creada exitosamente',
      data: solicitud
    };
  }
}

module.exports = CrearSolicitud;