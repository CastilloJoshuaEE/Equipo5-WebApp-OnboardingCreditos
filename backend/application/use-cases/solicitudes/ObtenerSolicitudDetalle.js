// backend/application/use-cases/solicitudes/ObtenerSolicitudDetalle.js
class ObtenerSolicitudDetalle {
  constructor(solicitudRepository, documentoRepository, verificacionKYCRepository) {
    this.solicitudRepository = solicitudRepository;
    this.documentoRepository = documentoRepository;
    this.verificacionKYCRepository = verificacionKYCRepository;
  }

  async execute(solicitud_id, usuario) {
    try {
      // Obtener solicitud
      const solicitud = await this.solicitudRepository.findById(solicitud_id);

      // Verificar permisos
      if (usuario.rol === 'solicitante' && solicitud.solicitante_id !== usuario.id) {
        return {
          success: false,
          status: 403,
          message: 'No tienes permisos para ver esta solicitud'
        };
      }

      let documentos = [];
      try {
        documentos = await this.documentoRepository.obtenerPorSolicitud(solicitud_id);
      } catch (error) {
        console.error('Error obteniendo documentos:', error);
        documentos = [];
      }

      // Obtener verificaciones KYC
      let verificaciones = [];
      try {
        verificaciones = await this.verificacionKYCRepository.obtenerPorSolicitud(solicitud_id);
      } catch (error) {
        console.error('Error obteniendo verificaciones:', error);
        verificaciones = [];
      }

      return {
        success: true,
        data: {
          ...solicitud,
          documentos,
          verificaciones_kyc: verificaciones,
          documentos_completos: documentos.length >= 3,
          documentos_obligatorios: this.verificarDocumentosObligatorios(documentos)
        }
      };
    } catch (error) {
      console.error('Error en ObtenerSolicitudDetalle:', error);
      return {
        success: false,
        status: 500,
        message: 'Error al obtener detalle de solicitud: ' + error.message
      };
    }
  }
  
  verificarDocumentosObligatorios(documentos) {
    const tiposObligatorios = ['dni', 'cuit', 'comprobante_domicilio'];
    const documentosPorTipo = documentos.reduce((acc, doc) => {
      acc[doc.tipo] = acc[doc.tipo] || [];
      acc[doc.tipo].push(doc);
      return acc;
    }, {});

    const resultado = {};
    tiposObligatorios.forEach(tipo => {
      resultado[tipo] = {
        presente: !!documentosPorTipo[tipo],
        validado: documentosPorTipo[tipo]?.some(doc => doc.estado === 'validado') || false,
        documentos: documentosPorTipo[tipo] || []
      };
    });

    return resultado;
  }
}

module.exports = ObtenerSolicitudDetalle;