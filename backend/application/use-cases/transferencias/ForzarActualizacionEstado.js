//backend/application/use-cases/transferencias/ForzarActualizacionEstado.js
class ForzarActualizacionEstado {
  constructor(transferenciaRepository, supabase) {
    this.transferenciaRepository = transferenciaRepository;
    this.supabase = supabase;
  }

  async execute(solicitud_id, usuario) {
    console.log(`Forzando actualización para solicitud: ${solicitud_id} por usuario: ${usuario.id}`);

    const { data: firmas, error: firmaError } = await this.supabase
      .from('firmas_digitales')
      .select('*')
      .eq('solicitud_id', solicitud_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (firmaError) {
      console.error('Error en consulta de firma:', firmaError);
      return {
        success: false,
        status: 500,
        message: 'Error al consultar firma digital'
      };
    }

    if (!firmas || firmas.length === 0) {
      console.log(`No se encontró proceso de firma para: ${solicitud_id}`);
      return {
        success: false,
        status: 404,
        message: 'No se encontró proceso de firma para esta solicitud'
      };
    }

    const firmaActual = firmas[0];
    console.log(`Estado actual de firma: ${firmaActual.estado}, Integridad: ${firmaActual.integridad_valida}`);

    let ambasPartesFirmaron = false;
    let motivo = '';

    if (firmaActual.estado === 'firmado_completo' &&
        firmaActual.fecha_firma_solicitante &&
        firmaActual.fecha_firma_operador) {
      ambasPartesFirmaron = true;
      motivo = 'Ambas partes han firmado correctamente';
    } else {
      motivo = `Firma incompleta. Estado: ${firmaActual.estado}, Solicitante: ${!!firmaActual.fecha_firma_solicitante}, Operador: ${!!firmaActual.fecha_firma_operador}`;
    }

    const { data: transferenciaExistente } = await this.supabase
      .from('transferencias_bancarias')
      .select('id, estado')
      .eq('solicitud_id', solicitud_id)
      .in('estado', ['pendiente', 'procesando', 'completada'])
      .maybeSingle();

    const habilitado = ambasPartesFirmaron && !transferenciaExistente;

    console.log(`Resultado final - Habilitado: ${habilitado}, Motivo: ${motivo}`);

    return {
      success: true,
      data: {
        habilitado,
        estado_firma: firmaActual.estado,
        integridad_valida: firmaActual.integridad_valida,
        firma_id: firmaActual.id,
        existe_transferencia: !!transferenciaExistente,
        transferencia_existente: transferenciaExistente,
        motivo: habilitado ? 'Firma completada correctamente por ambas partes' : motivo,
        detalles: {
          tiene_firma_solicitante: !!firmaActual.fecha_firma_solicitante,
          tiene_firma_operador: !!firmaActual.fecha_firma_operador,
          fecha_firma_completa: firmaActual.fecha_firma_completa,
          datos_completos_firma: firmaActual
        }
      }
    };
  }
}

module.exports = ForzarActualizacionEstado;