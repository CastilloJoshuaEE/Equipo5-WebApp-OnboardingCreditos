// backend/application/use-cases/transferencias/ObtenerComprobante.js
class ObtenerComprobante {
  constructor(transferenciaRepository, supabase) {
    this.transferenciaRepository = transferenciaRepository;
    this.supabase = supabase;
  }

  async execute(transferencia_id, usuario) {
    const tienePermisos = await this.transferenciaRepository.verificarPermisos(
      transferencia_id,
      usuario.id,
      usuario.rol
    );

    if (!tienePermisos) {
      return {
        success: false,
        status: 403,
        message: 'No tiene permisos para acceder a este comprobante'
      };
    }

    const transferencia = await this.transferenciaRepository.obtenerInfoComprobante(transferencia_id);

    if (!transferencia) {
      return {
        success: false,
        status: 404,
        message: 'Transferencia no encontrada'
      };
    }

    if (!transferencia.ruta_comprobante) {
      return {
        success: false,
        status: 404,
        message: 'Comprobante no generado aún'
      };
    }

    if (transferencia.estado !== 'completada') {
      return {
        success: false,
        status: 400,
        message: 'La transferencia no está completada'
      };
    }

    const { data: fileData, error: downloadError } = await this.supabase.storage
      .from('kyc-documents')
      .download(transferencia.ruta_comprobante);

    if (downloadError) {
      throw new Error('Error descargando comprobante');
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      success: true,
      data: {
        buffer,
        nombre_archivo: `comprobante-${transferencia.numero_comprobante || transferencia_id}.pdf`,
        content_type: 'application/pdf',
        transferencia
      }
    };
  }
}

module.exports = ObtenerComprobante;