// backend/application/services/NotificacionEmailService.js
class NotificacionEmailService {
  constructor(emailService) {
    this.emailService = emailService;
  }

  async enviarEmailComprobanteSolicitante(email, nombre, transferencia, comprobanteBuffer) {
    try {
      const numeroComprobante = transferencia.numero_comprobante || 'N/A';
      const asunto = `Comprobante de Transferencia - ${numeroComprobante}`;

      const mensaje = `
        Hola ${nombre},

        Nos complace informarte que se ha completado la transferencia de tu crédito aprobado.

        DETALLES DE LA TRANSFERENCIA:
        • Monto: ${transferencia.moneda} ${transferencia.monto}
        • Número de comprobante: ${numeroComprobante}
        • Cuenta destino: ${transferencia.contactos_bancarios?.numero_cuenta || 'N/A'}
        • Banco destino: ${transferencia.contactos_bancarios?.nombre_banco || 'N/A'}
        • Fecha de procesamiento: ${new Date(transferencia.fecha_completada || transferencia.created_at).toLocaleDateString()}

        Se adjunta el comprobante de transferencia en formato PDF.

        Saludos cordiales,
        Equipo de Créditos Pyme
      `;

      const attachments = [];
      if (comprobanteBuffer) {
        attachments.push({
          filename: `comprobante-${numeroComprobante}.pdf`,
          content: comprobanteBuffer,
          contentType: 'application/pdf'
        });
      }

      const resultado = await this.emailService.enviarEmail({
        to: email,
        subject: asunto,
        text: mensaje,
        html: mensaje.replace(/\n/g, '<br>'),
        attachments: attachments
      });

      if (resultado.success) {
        console.log('Email con comprobante enviado al solicitante:', email);
      } else {
        console.error('Error enviando email al solicitante:', resultado.error);
      }

      return resultado;
    } catch (error) {
      console.error('Error enviando email con comprobante:', error);
      throw error;
    }
  }

  async enviarEmailConfirmacionOperador(email, nombre, transferencia, comprobanteBuffer) {
    try {
      const numeroComprobante = transferencia.numero_comprobante || 'N/A';
      const asunto = `Confirmación de Transferencia Procesada - ${numeroComprobante}`;

      const mensaje = `
        Hola ${nombre},

        Se ha procesado exitosamente la transferencia de crédito.

        DETALLES DE LA TRANSFERENCIA:
        • Solicitud: ${transferencia.solicitudes_credito?.numero_solicitud || 'N/A'}
        • Monto: ${transferencia.moneda} ${transferencia.monto}
        • Número de comprobante: ${numeroComprobante}
        • Cuenta destino: ${transferencia.contactos_bancarios?.numero_cuenta || 'N/A'}
        • Banco destino: ${transferencia.contactos_bancarios?.nombre_banco || 'N/A'}
        • Solicitante: ${transferencia.solicitudes_credito?.solicitantes?.usuarios?.nombre_completo || 'N/A'}
        • Fecha de procesamiento: ${new Date(transferencia.fecha_completada || transferencia.created_at).toLocaleDateString()}

        La transferencia ha sido marcada como COMPLETADA en el sistema.

        Se adjunta el comprobante para tus registros.
      `;

      const attachments = [];
      if (comprobanteBuffer) {
        attachments.push({
          filename: `comprobante-${numeroComprobante}.pdf`,
          content: comprobanteBuffer,
          contentType: 'application/pdf'
        });
      }

      const resultado = await this.emailService.enviarEmail({
        to: email,
        subject: asunto,
        text: mensaje,
        html: mensaje.replace(/\n/g, '<br>'),
        attachments: attachments
      });

      if (resultado.success) {
        console.log('Email de confirmación enviado al operador:', email);
      } else {
        console.error('Error enviando email al operador:', resultado.error);
      }

      return resultado;
    } catch (error) {
      console.error('Error enviando email al operador:', error);
      throw error;
    }
  }
}

module.exports = NotificacionEmailService;