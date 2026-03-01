// backend/application/use-cases/transferencias/SimularProcesamientoTransferencia.js
const GenerarComprobantePDF = require('./GenerarComprobantePDF'); // ← IMPORTAR

class SimularProcesamientoTransferencia {
  constructor(transferenciaRepository, notificacionEmailService, supabase) {
    this.transferenciaRepository = transferenciaRepository;
    this.notificacionEmailService = notificacionEmailService;
    this.supabase = supabase;
  }

  async execute(transferenciaId) {
    try {
      await this.transferenciaRepository.actualizarEstado(transferenciaId, 'procesando');

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Obtener la transferencia actualizada
      const transferencia = await this.transferenciaRepository.obtenerPorId(transferenciaId);

      if (transferencia) {
        //  GENERAR PDF ANTES DE MARCAR COMO COMPLETADA
        try {
          const generadorPDF = new GenerarComprobantePDF(this.transferenciaRepository, this.supabase);
          const pdfBuffer = await generadorPDF.execute(transferencia);
          
          // Actualizar el objeto transferencia con la nueva ruta
          const transferenciaActualizada = await this.transferenciaRepository.obtenerPorId(transferenciaId);
          
          // Ahora marcar como completada
          const transferenciaCompletada = await this.transferenciaRepository.actualizarEstado(
            transferenciaId,
            'completada',
            { fecha_completada: new Date().toISOString() }
          );
          
          // Usar la transferencia con la ruta del comprobante
          const transferenciaParaNotificaciones = transferenciaActualizada || transferenciaCompletada;
          
          await this.enviarNotificacionesCompletas(transferenciaParaNotificaciones);
          console.log(' Notificaciones y emails enviados exitosamente');
          
        } catch (pdfError) {
          console.error(' Error generando PDF:', pdfError);
          // Aún así marcar como completada pero sin PDF
          const transferenciaCompletada = await this.transferenciaRepository.actualizarEstado(
            transferenciaId,
            'completada',
            { fecha_completada: new Date().toISOString() }
          );
          await this.enviarNotificacionesCompletas(transferenciaCompletada);
        }
      }

      return transferencia;
    } catch (error) {
      console.error('Error en simulación de transferencia:', error);
      await this.transferenciaRepository.actualizarEstado(transferenciaId, 'fallida');
      throw error;
    }
  }

  async enviarNotificacionesCompletas(transferencia) {

    await this.crearNotificacionesInternas(transferencia);
    await this.enviarEmailsConComprobante(transferencia);

  }

  async crearNotificacionesInternas(transferencia) {
    const { data: transferenciaCompleta, error } = await this.supabase
      .from('transferencias_bancarias')
      .select(`
        *,
        solicitudes_credito (
          numero_solicitud,
          solicitante_id,
          operador_id,
          monto,
          moneda,
          solicitantes: solicitante_id (
            usuarios (*)
          )
        ),
        contactos_bancarios (*)
      `)
      .eq('id', transferencia.id)
      .single();

    if (error) throw error;

    const solicitud = transferenciaCompleta.solicitudes_credito;
    const solicitante = solicitud.solicitantes.usuarios;
    const contacto = transferenciaCompleta.contactos_bancarios;

    const numeroComprobante = transferenciaCompleta.numero_comprobante || 'N/A';


    const notificaciones = [
      {
        usuario_id: solicitud.solicitante_id,
        solicitud_id: transferencia.solicitud_id,
        tipo: 'transferencia_completada',
        titulo: 'Transferencia Completada',
        mensaje: `Se ha completado la transferencia de ${transferenciaCompleta.moneda} ${transferenciaCompleta.monto} a tu cuenta ${contacto.numero_cuenta} en ${contacto.nombre_banco}. Nº de comprobante: ${numeroComprobante}`,
        datos_adicionales: {
          transferencia_id: transferenciaCompleta.id,
          monto: transferenciaCompleta.monto,
          moneda: transferenciaCompleta.moneda,
          numero_comprobante: numeroComprobante,
          cuenta_destino: contacto.numero_cuenta,
          banco_destino: contacto.nombre_banco,
          fecha_completada: transferenciaCompleta.fecha_completada
        },
        leida: false,
        created_at: new Date().toISOString()
      },
      {
        usuario_id: solicitud.operador_id,
        solicitud_id: transferencia.solicitud_id,
        tipo: 'transferencia_procesada',
        titulo: 'Transferencia Procesada',
        mensaje: `Transferencia de ${transferenciaCompleta.moneda} ${transferenciaCompleta.monto} procesada exitosamente para la solicitud ${solicitud.numero_solicitud}. Comprobante: ${numeroComprobante}`,
        datos_adicionales: {
          transferencia_id: transferenciaCompleta.id,
          monto: transferenciaCompleta.monto,
          moneda: transferenciaCompleta.moneda,
          numero_comprobante: numeroComprobante,
          solicitante_nombre: solicitante.nombre_completo,
          cuenta_destino: contacto.numero_cuenta
        },
        leida: false,
        created_at: new Date().toISOString()
      }
    ];

    await this.transferenciaRepository.crearNotificaciones(notificaciones);
  }

  async enviarEmailsConComprobante(transferencia) {

    const { data: transferenciaCompleta, error } = await this.supabase
      .from('transferencias_bancarias')
      .select(`
        *,
        solicitudes_credito (
          numero_solicitud,
          solicitante_id,
          operador_id,
          monto,
          moneda,
          solicitantes: solicitante_id (
            usuarios (*)
          ),
          operadores: operador_id (
            usuarios (*)
          )
        ),
        contactos_bancarios (*)
      `)
      .eq('id', transferencia.id)
      .single();

    if (error) throw error;

    const solicitud = transferenciaCompleta.solicitudes_credito;
    const solicitante = solicitud.solicitantes?.usuarios;
    const operador = solicitud.operadores?.usuarios;
    const contacto = transferenciaCompleta.contactos_bancarios;

    let comprobanteBuffer = null;
    if (transferenciaCompleta.ruta_comprobante) {
      try {
        const { data: fileData, error: downloadError } = await this.supabase.storage
          .from('kyc-documents')
          .download(transferenciaCompleta.ruta_comprobante);

        if (!downloadError && fileData) {
          const arrayBuffer = await fileData.arrayBuffer();
          comprobanteBuffer = Buffer.from(arrayBuffer);
        }
      } catch (pdfError) {
        console.warn(' No se pudo obtener el comprobante PDF:', pdfError.message);
      }
    }

    const emailsEnviados = [];

    if (solicitante && solicitante.email) {
      try {
        const resultado = await this.notificacionEmailService.enviarEmailComprobanteSolicitante(
          solicitante.email,
          solicitante.nombre_completo,
          transferenciaCompleta,
          comprobanteBuffer
        );
        emailsEnviados.push({ tipo: 'solicitante', email: solicitante.email, resultado });
      } catch (error) {
        console.error(' Error enviando email al solicitante:', error);
      }
    }

    if (operador && operador.email) {
      try {
        const resultado = await this.notificacionEmailService.enviarEmailConfirmacionOperador(
          operador.email,
          operador.nombre_completo,
          transferenciaCompleta,
          comprobanteBuffer
        );
        emailsEnviados.push({ tipo: 'operador', email: operador.email, resultado });
      } catch (error) {
        console.error(' Error enviando email al operador:', error);
      }
    }

    return emailsEnviados;
  }
}

module.exports = SimularProcesamientoTransferencia;