// backend/application/use-cases/firmas/ReiniciarProcesoFirma.js
class ReiniciarProcesoFirma {
  constructor(firmaDigitalRepository) {
    this.firmaDigitalRepository = firmaDigitalRepository;
  }

  async execute(solicitud_id, { forzar_reinicio }) {

    // Buscar firma existente
    const firmaExistente = await this.firmaDigitalRepository.verificarFirmaActiva(solicitud_id);

    if (firmaExistente) {
      await this.firmaDigitalRepository.actualizar(firmaExistente.id, {
        estado: 'expirado',
        updated_at: new Date().toISOString()
      });

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