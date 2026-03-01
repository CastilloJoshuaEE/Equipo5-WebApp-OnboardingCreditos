// backend/domain/repositories/PlantillaDocumentoRepository.js
class PlantillaDocumentoRepository {
  async listar() {
    throw new Error('Método no implementado');
  }

  async obtenerPorId(id) {
    throw new Error('Método no implementado');
  }

  async obtenerPorTipo(tipo) {
    throw new Error('Método no implementado');
  }

  async obtenerActivaPorTipo(tipo) {
    throw new Error('Método no implementado');
  }

  async crear(plantillaData) {
    throw new Error('Método no implementado');
  }

  async actualizar(id, updateData) {
    throw new Error('Método no implementado');
  }

  async eliminar(id) {
    throw new Error('Método no implementado');
  }

  async marcarComoActiva(id, tipo) {
    throw new Error('Método no implementado');
  }

  async obtenerEstadisticas() {
    throw new Error('Método no implementado');
  }

  async buscar(termino) {
    throw new Error('Método no implementado');
  }

  async verificarNombreExistente(nombreArchivo, excluirId = null) {
    throw new Error('Método no implementado');
  }

  async subirArchivoStorage(rutaStorage, buffer, contentType) {
    throw new Error('Método no implementado');
  }

  async eliminarArchivoStorage(rutaStorage) {
    throw new Error('Método no implementado');
  }

  async descargarArchivo(rutaStorage) {
    throw new Error('Método no implementado');
  }

  async verificarArchivoExiste(rutaStorage) {
    throw new Error('Método no implementado');
  }

  async obtenerHistorial(id) {
    throw new Error('Método no implementado');
  }

  async registrarAuditoria(auditoriaData) {
    throw new Error('Método no implementado');
  }
}

module.exports = PlantillaDocumentoRepository;