// backend/application/use-cases/documentos/ObtenerTodosLosDocumentos.js

class ObtenerTodosLosDocumentos {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async execute(usuario) {
    console.log('. Obteniendo todos los documentos para operador:', usuario.id);

    if (usuario.rol !== 'operador') {
      return {
        success: false,
        status: 403,
        message: 'Solo los operadores pueden acceder a todos los documentos'
      };
    }

    // Obtener contratos con información completa y SOLO FIRMADOS COMPLETOS
    const { data: contratos, error: errorContratos } = await this.supabase
      .from('contratos')
      .select(`
        *,
        solicitudes_credito!inner(
          id,
          numero_solicitud,
          monto,
          moneda,
          estado,
          solicitante_id,
          solicitantes!solicitante_id(
            id,
            nombre_empresa,
            usuarios(
              id,
              nombre_completo,
              email,
              dni
            )
          )
        ),
        firmas_digitales(
          id,
          estado,
          fecha_firma_completa,
          url_documento_firmado,
          ruta_documento,
          integridad_valida
        )
      `)
      .order('created_at', { ascending: false });

    if (errorContratos) {
      console.error('Error obteniendo contratos:', errorContratos);
      return {
        success: false,
        status: 500,
        message: 'Error obteniendo contratos'
      };
    }

    // Obtener transferencias con información completa
    const { data: transferencias, error: errorTransferencias } = await this.supabase
      .from('transferencias_bancarias')
      .select(`
        *,
        solicitudes_credito!inner(
          id,
          numero_solicitud,
          monto,
          moneda,
          solicitante_id,
          solicitantes!solicitante_id(
            id,
            nombre_empresa,
            usuarios(
              id,
              nombre_completo,
              email
            )
          )
        ),
        contactos_bancarios(
          nombre_banco,
          numero_cuenta,
          tipo_cuenta
        )
      `)
      .order('created_at', { ascending: false });

    if (errorTransferencias) {
      console.error('Error obteniendo transferencias:', errorTransferencias);
      return {
        success: false,
        status: 500,
        message: 'Error obteniendo transferencias'
      };
    }

    const documentosFormateados = {
      contratos: (contratos || []).map(contrato => ({
        id: contrato.id,
        tipo: 'contrato',
        numero_contrato: contrato.numero_contrato,
        estado: contrato.estado,
        ruta_documento: contrato.ruta_documento,
        monto: contrato.monto_aprobado,
        moneda: contrato.moneda || 'USD',
        created_at: contrato.created_at,
        updated_at: contrato.updated_at,
        numero_solicitud: contrato.solicitudes_credito?.numero_solicitud,
        solicitante_nombre: contrato.solicitudes_credito?.solicitantes?.usuarios?.nombre_completo,
        firma_digital: contrato.firmas_digitales?.[0] || null,
        esta_firmado: contrato.firmas_digitales?.some(f => f.estado === 'firmado_completo') || false,
        tiene_documento_firmado: !!contrato.firmas_digitales?.[0]?.url_documento_firmado,
        url_documento_firmado: contrato.firmas_digitales?.[0]?.url_documento_firmado,
        firma_id: contrato.firmas_digitales?.[0]?.id
      })),
      transferencias: (transferencias || []).map(transferencia => ({
        id: transferencia.id,
        tipo: 'comprobante',
        numero_comprobante: transferencia.numero_comprobante,
        estado: transferencia.estado,
        ruta_comprobante: transferencia.ruta_comprobante,
        monto: transferencia.monto,
        moneda: transferencia.moneda,
        fecha_procesamiento: transferencia.fecha_procesamiento,
        fecha_completada: transferencia.fecha_completada,
        banco_destino: transferencia.banco_destino || transferencia.contactos_bancarios?.nombre_banco,
        cuenta_destino: transferencia.cuenta_destino || transferencia.contactos_bancarios?.numero_cuenta,
        numero_solicitud: transferencia.solicitudes_credito?.numero_solicitud,
        solicitante_nombre: transferencia.solicitudes_credito?.solicitantes?.usuarios?.nombre_completo,
        contacto_bancario: transferencia.contactos_bancarios
      }))
    };

    console.log(`. Documentos cargados: ${documentosFormateados.contratos.length} contratos, ${documentosFormateados.transferencias.length} transferencias`);

    return {
      success: true,
      data: documentosFormateados
    };
  }
}

module.exports = ObtenerTodosLosDocumentos;