//backend/application/use-cases/transferencias/CrearTransferencia.js
const TransferenciaBancaria = require('../../../domain/entities/TransferenciaBancaria');

class CrearTransferencia {
  constructor(transferenciaRepository) {
    this.transferenciaRepository = transferenciaRepository;
  }

  async execute(data, usuario) {
    const {
      solicitud_id,
      contacto_bancario_id,
      monto,
      moneda = 'USD',
      motivo
    } = data;

    const operador_id = usuario.id;

    console.log('Iniciando creación de transferencia:', {
      solicitud_id,
      contacto_bancario_id,
      monto,
      operador_id
    });

    if (!solicitud_id || !contacto_bancario_id || !monto) {
      return {
        success: false,
        status: 400,
        message: 'Solicitud ID, contacto bancario ID y monto son requeridos'
      };
    }

    const solicitud = await this.transferenciaRepository.obtenerSolicitud(solicitud_id);
    if (!solicitud) {
      return {
        success: false,
        status: 404,
        message: 'Solicitud no encontrada'
      };
    }

    if (solicitud.operador_id !== operador_id) {
      return {
        success: false,
        status: 403,
        message: 'No tienes permisos para realizar transferencias en esta solicitud'
      };
    }

    const firmas = await this.transferenciaRepository.verificarEstadoFirma(solicitud_id);
    if (!firmas || firmas.length === 0) {
      return {
        success: false,
        status: 400,
        message: 'No se encontró proceso de firma para esta solicitud'
      };
    }

    const firma = firmas[0];
    const ambasPartesFirmaron =
      firma.fecha_firma_solicitante &&
      firma.fecha_firma_operador &&
      firma.estado === 'firmado_completo';

    if (!ambasPartesFirmaron) {
      return {
        success: false,
        status: 400,
        message: `Firma digital incompleta. Estado: ${firma.estado || 'no definido'}`,
        detalles: {
          tiene_firma_solicitante: !!firma.fecha_firma_solicitante,
          tiene_firma_operador: !!firma.fecha_firma_operador,
          estado_firma: firma.estado
        }
      };
    }

    const contacto = await this.transferenciaRepository.obtenerContactoBancario(contacto_bancario_id);
    if (!contacto) {
      return {
        success: false,
        status: 404,
        message: 'Contacto bancario no encontrado'
      };
    }

    console.log('Verificando relación contacto-solicitante:', {
      contacto_solicitante_id: contacto.solicitante_id,
      solicitud_solicitante_id: solicitud.solicitante_id
    });

    if (!contacto.solicitante_id || contacto.solicitante_id !== solicitud.solicitante_id) {
      return {
        success: false,
        status: 400,
        message: 'El contacto bancario no pertenece al solicitante de esta solicitud',
        detalles: {
          contacto_solicitante_id: contacto.solicitante_id,
          solicitud_solicitante_id: solicitud.solicitante_id
        }
      };
    }

    const contrato = await this.transferenciaRepository.obtenerContrato(solicitud_id);
    if (!contrato) {
      return {
        success: false,
        status: 404,
        message: 'Contrato no encontrado'
      };
    }

    const numero_comprobante = TransferenciaBancaria.generarNumeroComprobante();

    const transferenciaEntity = new TransferenciaBancaria({
      solicitud_id,
      contrato_id: contrato.id,
      contacto_bancario_id,
      monto: parseFloat(monto),
      moneda,
      numero_comprobante,
      cuenta_destino: contacto.numero_cuenta,
      banco_destino: contacto.nombre_banco,
      motivo,
      costo_transferencia: 0,
      estado: TransferenciaBancaria.ESTADOS.PENDIENTE,
      procesado_por: operador_id,
      fecha_procesamiento: new Date().toISOString()
    });

    transferenciaEntity.validar();

    console.log('Insertando transferencia:', transferenciaEntity.toJSON());

    const transferencia = await this.transferenciaRepository.crear(transferenciaEntity.toJSON());

    console.log('Transferencia creada exitosamente:', transferencia.id);

    return {
      success: true,
      status: 201,
      message: 'Transferencia creada exitosamente',
      data: transferencia
    };
  }
}

module.exports = CrearTransferencia;