// backend/application/use-cases/operador/IniciarRevisionSolicitud.js
const Solicitud = require('../../../domain/entities/Solicitud');

class IniciarRevisionSolicitud {
  constructor(solicitudRepository, bcraService, supabase) {
    this.solicitudRepository = solicitudRepository;
    this.bcraService = bcraService;
    this.supabase = supabase;
  }

  async execute(solicitudId, operadorId) {
    const solicitud = await this.solicitudRepository.getSolicitudWithRelations(solicitudId);

    if (!solicitud) {
      return {
        success: false,
        status: 404,
        message: 'Solicitud no encontrada'
      };
    }

    if (solicitud.operador_id !== operadorId) {
      return {
        success: false,
        status: 404,
        message: 'Solicitud no encontrada o no asignada a este operador'
      };
    }

    let datosSolicitante = null;

    if (solicitud.solicitantes) {
      let usuariosData = solicitud.solicitantes.usuarios;

      if (Array.isArray(usuariosData)) {
        usuariosData = usuariosData.length > 0 ? usuariosData[0] : null;
      }

      const usuarioInfo = usuariosData && typeof usuariosData === 'object'
        ? {
            nombre: usuariosData?.nombre_completo || 'Desconocido',
            email: usuariosData?.email || 'No disponible',
            telefono: usuariosData?.telefono || 'No disponible',
            dni: usuariosData?.dni || 'No disponible',
          }
        : {
            nombre: 'Desconocido',
            email: 'No disponible',
            telefono: 'No disponible',
            dni: 'No disponible',
          };

      datosSolicitante = {
        ...solicitud.solicitantes,
        usuarios: usuariosData || {},
        contacto_info: usuarioInfo,
      };
    }

    const documentos = await this.solicitudRepository.getDocumentos(solicitudId);

    let infoBCRA = null;
    if (solicitud.solicitantes?.cuit) {
      try {
        const cuitLimpio = solicitud.solicitantes.cuit.replace(/\D/g, '');
        infoBCRA = await this.bcraService.consultarDeudas(cuitLimpio);

        if (infoBCRA.success) {
          await this.supabase.from('auditoria').insert({
            usuario_id: operadorId,
            solicitud_id: solicitudId,
            accion: 'consulta_bcra',
            detalle: `Consulta BCRA realizada para CUIT: ${solicitud.solicitantes.cuit}`,
            created_at: new Date().toISOString(),
          });
        }
      } catch (bcraError) {
        console.warn('Error consultando BCRA:', bcraError.message);
        infoBCRA = { success: false, error: bcraError.message };
      }
    }

    const scoring = this.calcularScoringDocumentos(documentos || []);

    if (solicitud.estado === Solicitud.ESTADOS.ENVIADO) {
      await this.solicitudRepository.updateEstado(solicitudId, Solicitud.ESTADOS.EN_REVISION);
    }

    return {
      success: true,
      data: {
        solicitud: {
          ...solicitud,
          estado: Solicitud.ESTADOS.EN_REVISION,
          solicitante_info: datosSolicitante?.contacto_info || null,
        },
        documentos: documentos || [],
        infoBCRA,
        scoring,
        solicitante: datosSolicitante,
      },
    };
  }

  calcularScoringDocumentos(documentos) {
    const documentosRequeridos = [
      'dni',
      'cuit',
      'comprobante_domicilio',
      'balance_contable',
      'declaracion_impuestos'
    ];

    let scoring = {
      total: 0,
      desglose: {},
      documentosFaltantes: [],
      documentosValidados: 0,
      documentosPendientes: 0,
      documentosSubidos: 0
    };

    documentosRequeridos.forEach(tipo => {
      const doc = documentos.find(d => d.tipo === tipo);

      if (doc) {
        if (doc.estado === 'validado') {
          scoring.desglose[tipo] = {
            puntaje: 20,
            estado: 'validado',
            documento_id: doc.id,
            nombre_archivo: doc.nombre_archivo,
            ruta_storage: doc.ruta_storage
          };
          scoring.total += 20;
          scoring.documentosValidados++;
        } else {
          scoring.desglose[tipo] = {
            puntaje: 0,
            estado: doc.estado,
            documento_id: doc.id,
            nombre_archivo: doc.nombre_archivo,
            ruta_storage: doc.ruta_storage
          };
          scoring.documentosPendientes++;
        }
        scoring.documentosSubidos++;
      } else {
        scoring.desglose[tipo] = {
          puntaje: 0,
          estado: 'pendiente'
        };
        scoring.documentosPendientes++;
      }
    });

    return scoring;
  }
}

module.exports = IniciarRevisionSolicitud;