// backend/application/use-cases/solicitudes/CrearSolicitud.js
const Solicitud = require('../../../domain/entities/Solicitud');

class CrearSolicitud {
  constructor(solicitudRepository) {
    this.solicitudRepository = solicitudRepository;
  }

  async execute(data, usuario) {
    try {
      const {
        monto,
        plazo_meses,
        proposito,
        moneda = 'ARS'
      } = data;

      const solicitante_id = usuario.id;

      // Validaciones
      if (!monto || monto <= 0) {
        return {
          success: false,
          status: 400,
          message: 'Monto debe ser mayor a 0'
        };
      }

      if (!plazo_meses || plazo_meses < 1) {
        return {
          success: false,
          status: 400,
          message: 'Plazo en meses debe ser al menos 1'
        };
      }

      if (!proposito || proposito.trim().length < 10) {
        return {
          success: false,
          status: 400,
          message: 'Propósito debe tener al menos 10 caracteres'
        };
      }

      // Generar número de solicitud único
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const numeroSolicitud = `SOL-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}${new Date().getDate().toString().padStart(2,'0')}-${randomStr}`;

      // Crear entidad Solicitud (SIN incluir id)
      const solicitudData = {
        numero_solicitud: numeroSolicitud,
        solicitante_id,
        monto: parseFloat(monto),
        plazo_meses: parseInt(plazo_meses),
        proposito: proposito.trim(),
        moneda,
        estado: Solicitud.ESTADOS.BORRADOR,
        nivel_riesgo: Solicitud.NIVELES_RIESGO.MEDIO,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Validar antes de crear
      const solicitudEntity = new Solicitud(solicitudData);
      solicitudEntity.validar();

      // Crear en base de datos (el repositorio no debe incluir id)
      const solicitud = await this.solicitudRepository.create(solicitudData);

      return {
        success: true,
        status: 201,
        message: 'Solicitud de crédito creada exitosamente',
        data: solicitud
      };
    } catch (error) {
      console.error('Error en CrearSolicitud.execute:', error);
      return {
        success: false,
        status: 500,
        message: error.message || 'Error al crear la solicitud'
      };
    }
  }
}

module.exports = CrearSolicitud;