// backend/application/use-cases/transferencias/VerificarHabilitacionTransferencia.js
class VerificarHabilitacionTransferencia {
  constructor(transferenciaRepository) {
    this.transferenciaRepository = transferenciaRepository;
  }

  async execute(solicitud_id) {
    console.log(`Verificando habilitación para solicitud: ${solicitud_id}`);

    const firmas = await this.transferenciaRepository.verificarEstadoFirma(solicitud_id);

    console.log('Firmas encontradas:', firmas?.length || 0);

    if (!firmas || firmas.length === 0) {
      return {
        success: true,
        data: {
          habilitado: false,
          motivo: 'No se encontró proceso de firma para esta solicitud',
          estado_actual: 'no_encontrado'
        }
      };
    }

    const firma = firmas[0];

    const ambasPartesFirmaron = (
      firma.fecha_firma_solicitante &&
      firma.fecha_firma_operador &&
      firma.estado === 'firmado_completo'
    );

    console.log('Resultado verificación firma:', {
      estado: firma.estado,
      integridad_valida: firma.integridad_valida,
      tiene_firma_solicitante: !!firma.fecha_firma_solicitante,
      tiene_firma_operador: !!firma.fecha_firma_operador,
      ambas_partes_firmaron: ambasPartesFirmaron
    });

    if (!ambasPartesFirmaron) {
      return {
        success: true,
        data: {
          habilitado: false,
          motivo: `Firma digital incompleta. Estado: ${firma.estado || 'no definido'}`,
          estado_actual: firma.estado || 'no_encontrada',
          integridad_valida: firma.integridad_valida,
          tiene_firma_solicitante: !!firma.fecha_firma_solicitante,
          tiene_firma_operador: !!firma.fecha_firma_operador,
          detalles_firma: firma
        }
      };
    }

    const transferenciaExistente = await this.transferenciaRepository.verificarTransferenciaExistente(solicitud_id);

    if (transferenciaExistente) {
      return {
        success: true,
        data: {
          habilitado: false,
          existe_transferencia: true,
          motivo: 'Ya existe una transferencia para esta solicitud',
          transferencia_existente: transferenciaExistente
        }
      };
    }

    console.log(`Transferencia HABILITADA para solicitud: ${solicitud_id} - Ambas partes firmaron`);

    return {
      success: true,
      data: {
        habilitado: true,
        fecha_firma_completa: firma.fecha_firma_completa,
        estado_firma: firma.estado,
        integridad_valida: firma.integridad_valida,
        motivo: 'Firma digital completada correctamente por ambas partes',
        detalles_completos: firma
      }
    };
  }
}

module.exports = VerificarHabilitacionTransferencia;