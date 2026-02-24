// backend/application/use-cases/firmas/ReiniciarProcesoFirma.js
class ReiniciarProcesoFirma {
  constructor(firmaDigitalRepository) {
    this.firmaDigitalRepository = firmaDigitalRepository;
  }

  async execute(solicitud_id, { forzar_reinicio }) {
    console.log('. Reiniciando proceso de firma para:', solicitud_id);

    // Buscar firma existente
    const firmaExistente = await this.firmaDigitalRepository.verificarFirmaActiva(solicitud_id);

    if (firmaExistente) {
      await this.firmaDigitalRepository.actualizar(firmaExistente.id, {
        estado: 'expirado',
        updated_at: new Date().toISOString()
      });

      console.log('. Proceso de firma anterior marcado como expirado:', firmaExistente.id);
    }

    return {
      success: true,
      message: 'Proceso reiniciado exitosamente',
      data: {
        firma_anterior: firmaExistente
      }
    };
  }
}

module.exports = ReiniciarProcesoFirma;