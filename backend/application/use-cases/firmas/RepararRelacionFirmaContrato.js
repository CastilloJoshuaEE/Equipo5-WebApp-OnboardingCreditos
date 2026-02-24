// backend/application/use-cases/firmas/RepararRelacionFirmaContrato.js
class RepararRelacionFirmaContrato {
  constructor(firmaDigitalRepository) {
    this.firmaDigitalRepository = firmaDigitalRepository;
  }

  async execute(firma_id, usuario) {
    console.log('. Reparando relación firma-contrato para:', firma_id);

    const resultado = await this.firmaDigitalRepository.repararRelacionFirmaContrato(firma_id);

    // Registrar auditoría
    await this.firmaDigitalRepository.registrarAuditoria({
      firma_id: firma_id,
      usuario_id: usuario.id,
      accion: 'reparar_relacion_firma_contrato',
      descripcion: 'Relación firma-contrato reparada manualmente',
      ip_address: usuario.ip,
      user_agent: usuario.userAgent,
      created_at: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Relación firma-contrato reparada exitosamente',
      data: {
        firma_id: resultado.firma.id,
        contrato_id: resultado.contrato.id,
        contrato_ruta_documento: resultado.contrato.ruta_documento
      }
    };
  }
}

module.exports = RepararRelacionFirmaContrato;