// backend/application/use-cases/usuario/EliminarCuenta.js
class EliminarCuenta {
  constructor(usuarioRepository, authService, supabase) {
    this.usuarioRepository = usuarioRepository;
    this.authService = authService;
    this.supabase = supabase;
  }

  async execute(usuarioId, email, { password }) {
    if (!password) {
      return {
        success: false,
        status: 400,
        message: 'La contraseña es requerida para eliminar la cuenta'
      };
    }

    const verifyResult = await this.authService.signInWithPassword(email, password);

    if (!verifyResult.success) {
      return {
        success: false,
        status: 400,
        message: 'La contraseña es incorrecta'
      };
    }

    const { data: result, error: transactionError } = await this.supabase
      .rpc('eliminar_usuario_completamente', {
        p_usuario_id: usuarioId
      });

    if (transactionError) {
      if (transactionError.message.includes('function eliminar_usuario_completamente(uuid) does not exist')) {
        await this.ejecutarEliminacionManual(usuarioId);
      } else {
        throw new Error('Error al eliminar los datos del usuario: ' + transactionError.message);
      }
    }

    await this.authService.deleteUser(usuarioId);
    await this.authService.signOut();

    return {
      success: true,
      message: 'Cuenta eliminada completamente. Serás redirigido...',
      data: {
        usuario_id: usuarioId,
        fecha_eliminacion: new Date().toISOString()
      }
    };
  }

  async ejecutarEliminacionManual(usuarioId) {
    const queries = [
      `DELETE FROM auditoria WHERE usuario_id = '${usuarioId}' OR solicitud_id IN (SELECT id FROM solicitudes_credito WHERE solicitante_id = '${usuarioId}' OR operador_id = '${usuarioId}')`,
      `DELETE FROM auditoria_firmas WHERE usuario_id = '${usuarioId}' OR firma_id IN (SELECT id FROM firmas_digitales WHERE solicitud_id IN (SELECT id FROM solicitudes_credito WHERE solicitante_id = '${usuarioId}' OR operador_id = '${usuarioId}'))`,
      `DELETE FROM chatbot_interacciones WHERE usuario_id = '${usuarioId}'`,
      `DELETE FROM intentos_login WHERE usuario_id = '${usuarioId}'`,
      `DELETE FROM historial_contrasenas WHERE usuario_id = '${usuarioId}'`,
      `DELETE FROM notificaciones WHERE usuario_id = '${usuarioId}' OR solicitud_id IN (SELECT id FROM solicitudes_credito WHERE solicitante_id = '${usuarioId}' OR operador_id = '${usuarioId}')`,
      `DELETE FROM comentarios_solicitud WHERE usuario_id = '${usuarioId}' OR solicitud_id IN (SELECT id FROM solicitudes_credito WHERE solicitante_id = '${usuarioId}' OR operador_id = '${usuarioId}')`,
      `DELETE FROM condiciones_aprobacion WHERE creado_por = '${usuarioId}'`,
      `DELETE FROM solicitudes_informacion WHERE solicitado_por = '${usuarioId}'`,
      `DELETE FROM verificaciones_kyc WHERE solicitud_id IN (SELECT id FROM solicitudes_credito WHERE solicitante_id = '${usuarioId}')`,
      `DELETE FROM documentos WHERE solicitud_id IN (SELECT id FROM solicitudes_credito WHERE solicitante_id = '${usuarioId}' OR operador_id = '${usuarioId}')`,
      `DELETE FROM firmas_digitales WHERE solicitud_id IN (SELECT id FROM solicitudes_credito WHERE solicitante_id = '${usuarioId}' OR operador_id = '${usuarioId}')`,
      `DELETE FROM transferencias_bancarias WHERE contrato_id IN (SELECT id FROM contratos WHERE solicitud_id IN (SELECT id FROM solicitudes_credito WHERE solicitante_id = '${usuarioId}' OR operador_id = '${usuarioId}'))`,
      `DELETE FROM contratos WHERE solicitud_id IN (SELECT id FROM solicitudes_credito WHERE solicitante_id = '${usuarioId}' OR operador_id = '${usuarioId}')`,
      `DELETE FROM solicitudes_credito WHERE solicitante_id = '${usuarioId}' OR operador_id = '${usuarioId}'`,
      `DELETE FROM contactos_bancarios WHERE solicitante_id = '${usuarioId}'`,
      `DELETE FROM operadores WHERE id = '${usuarioId}'`,
      `DELETE FROM solicitantes WHERE id = '${usuarioId}'`,
      `DELETE FROM usuarios WHERE id = '${usuarioId}'`
    ];

    for (const query of queries) {
      const { error } = await this.supabase.rpc('exec_sql', { sql_query: query });
      if (error) {
        console.warn(`Advertencia en query: ${error.message}`);
      }
    }
  }
}

module.exports = EliminarCuenta;