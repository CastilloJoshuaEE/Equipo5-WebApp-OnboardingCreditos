// backend/application/use-cases/operador/ValidarDocumento.js

const Solicitud = require('../../../domain/entities/Solicitud');
class ValidarDocumento {
  constructor(solicitudRepository, supabase) {
    this.solicitudRepository = solicitudRepository;
    this.supabase = supabase;
  }

  async execute(solicitudId, documentoId, usuarioId, { validado, comentarios, informacion_extraida }) {
    const { data: documento, error } = await this.supabase
      .from('documentos')
      .update({
        estado: validado ? 'validado' : 'rechazado',
        comentarios,
        informacion_extraida: informacion_extraida || null,
        validado_en: new Date().toISOString()
      })
      .eq('id', documentoId)
      .eq('solicitud_id', solicitudId)
      .eq('tipo', 'balance_contable')
      .select()
      .single();

    if (error) throw error;

    await this.recalcularScoringSolicitud(solicitudId);

    await this.supabase
      .from('auditoria')
      .insert({
        usuario_id: usuarioId,
        solicitud_id: solicitudId,
        accion: 'validar_documento',
        detalle: `Balance contable ${validado ? 'validado' : 'rechazado'}`,
        estado_anterior: 'pendiente',
        estado_nuevo: validado ? 'validado' : 'rechazado'
      });

    return {
      success: true,
      message: `Documento ${validado ? 'validado' : 'rechazado'} exitosamente`,
      data: documento
    };
  }

  async recalcularScoringSolicitud(solicitudId) {
    const { data: documentos } = await this.supabase
      .from('documentos')
      .select('*')
      .eq('solicitud_id', solicitudId);

    const documentosRequeridos = ['dni', 'cuit', 'comprobante_domicilio', 'balance_contable', 'declaracion_impuestos'];
    let documentosValidados = 0;

    documentosRequeridos.forEach(tipo => {
      const doc = documentos.find(d => d.tipo === tipo);
      if (doc && doc.estado === 'validado') {
        documentosValidados++;
      }
    });

    const scoring = documentosValidados * 20;

    let nivel_riesgo = 'alto';
    if (scoring >= 80) nivel_riesgo = 'bajo';
    else if (scoring >= 60) nivel_riesgo = 'medio';

    await this.supabase
      .from('solicitudes_credito')
      .update({
        nivel_riesgo: nivel_riesgo,
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitudId);

    return scoring;
  }
}

module.exports = ValidarDocumento;