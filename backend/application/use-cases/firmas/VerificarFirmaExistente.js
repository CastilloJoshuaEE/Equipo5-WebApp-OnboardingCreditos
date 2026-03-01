// backend/application/use-cases/firmas/VerificarFirmaExistente.js
class VerificarFirmaExistente {
  constructor(firmaDigitalRepository) {
    this.firmaDigitalRepository = firmaDigitalRepository;
  }

  async execute(solicitud_id) {
    const firmaExistente = await this.firmaDigitalRepository.verificarFirmaActiva(solicitud_id);

    return {
      success: true,
      data: {
        firma_existente: firmaExistente || null,
        existe: !!firmaExistente
      }
    };
  }
}

module.exports = VerificarFirmaExistente;