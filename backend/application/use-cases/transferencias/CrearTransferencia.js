// backend/application/use-cases/transferencias/CrearTransferencia.js
const TransferenciaBancaria = require('../../../domain/entities/TransferenciaBancaria');
const SimularProcesamientoTransferencia = require('./SimularProcesamientoTransferencia');

class CrearTransferencia {
  constructor(transferenciaRepository, notificacionService, supabase) {
    this.transferenciaRepository = transferenciaRepository;
    this.notificacionService = notificacionService;
    this.supabase = supabase;
  }

  async execute(data, usuario) {
    const {
      solicitud_id,
      contacto_bancario_id,
      monto,
      moneda = 'USD',
      motivo
    } = data;

    const operador_id = usuario.id;

    console.log('Iniciando creación de transferencia:', {
      solicitud_id,
      contacto_bancario_id,
      monto,
      operador_id
    });

    // ... validaciones existentes ...

    const transferenciaEntity = new TransferenciaBancaria({
      solicitud_id,
      contrato_id: contrato.id,
      contacto_bancario_id,
      monto: parseFloat(monto),
      moneda,
      numero_comprobante,
      cuenta_destino: contacto.numero_cuenta,
      banco_destino: contacto.nombre_banco,
      motivo,
      costo_transferencia: 0,
      estado: TransferenciaBancaria.ESTADOS.PENDIENTE,
      procesado_por: operador_id,
      fecha_procesamiento: new Date().toISOString()
    });

    transferenciaEntity.validar();

    console.log('Insertando transferencia:', transferenciaEntity.toJSON());

    const transferencia = await this.transferenciaRepository.crear(transferenciaEntity.toJSON());

    console.log('Transferencia creada exitosamente:', transferencia.id);

    //  INICIAR PROCESAMIENTO AUTOMÁTICO
    try {
      console.log('Iniciando procesamiento automático de transferencia...');
      
      // Actualizar estado a "procesando"
      await this.transferenciaRepository.actualizarEstado(transferencia.id, 'procesando');
      
      // Esperar 3 segundos para simular procesamiento bancario
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Actualizar a "completada"
      const transferenciaCompletada = await this.transferenciaRepository.actualizarEstado(
        transferencia.id,
        'completada',
        { fecha_completada: new Date().toISOString() }
      );
      
      // Generar PDF y enviar emails
      if (transferenciaCompletada) {
        await this.procesarComprobanteYNotificaciones(transferenciaCompletada);
      }
      
    } catch (procesamientoError) {
      console.error('Error en procesamiento automático:', procesamientoError);
      // Marcar como fallida
      await this.transferenciaRepository.actualizarEstado(transferencia.id, 'fallida', {
        motivo_fallo: procesamientoError.message
      });
    }

    return {
      success: true,
      status: 201,
      message: 'Transferencia creada y procesada exitosamente',
      data: transferencia
    };
  }

  async procesarComprobanteYNotificaciones(transferencia) {
    console.log('Procesando comprobante y notificaciones para transferencia:', transferencia.id);

    try {
      // 1. Generar PDF
      const pdfService = new (require('./GenerarComprobantePDF'))(this.transferenciaRepository, this.supabase);
      const pdfBuffer = await pdfService.execute(transferencia);
      console.log('PDF generado exitosamente, tamaño:', pdfBuffer.length);

      // 2. Obtener datos completos para notificaciones
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

      // 3. Crear notificaciones internas
      const numeroComprobante = transferenciaCompleta.numero_comprobante || 'N/A';
      
      const notificaciones = [
        {
          usuario_id: solicitud.solicitante_id,
          solicitud_id: transferencia.solicitud_id,
          tipo: 'transferencia_completada',
          titulo: 'Transferencia Completada',
          mensaje: `Se ha completado la transferencia de ${transferenciaCompleta.moneda} ${transferenciaCompleta.monto} a tu cuenta ${transferenciaCompleta.contactos_bancarios?.numero_cuenta}. Nº comprobante: ${numeroComprobante}`,
          datos_adicionales: {
            transferencia_id: transferenciaCompleta.id,
            monto: transferenciaCompleta.monto,
            moneda: transferenciaCompleta.moneda,
            numero_comprobante: numeroComprobante
          },
          leida: false,
          created_at: new Date().toISOString()
        },
        {
          usuario_id: solicitud.operador_id,
          solicitud_id: transferencia.solicitud_id,
          tipo: 'transferencia_procesada',
          titulo: 'Transferencia Procesada',
          mensaje: `Transferencia de ${transferenciaCompleta.moneda} ${transferenciaCompleta.monto} procesada para solicitud ${solicitud.numero_solicitud}`,
          datos_adicionales: {
            transferencia_id: transferenciaCompleta.id,
            monto: transferenciaCompleta.monto,
            moneda: transferenciaCompleta.moneda,
            numero_comprobante: numeroComprobante
          },
          leida: false,
          created_at: new Date().toISOString()
        }
      ];

      await this.transferenciaRepository.crearNotificaciones(notificaciones);
      console.log('Notificaciones internas creadas');

      // 4. Enviar emails con comprobante
      if (solicitante?.email) {
        await this.notificacionService.enviarEmailComprobanteSolicitante(
          solicitante.email,
          solicitante.nombre_completo,
          transferenciaCompleta,
          pdfBuffer
        );
        console.log('Email enviado a solicitante:', solicitante.email);
      }

      if (operador?.email) {
        await this.notificacionService.enviarEmailConfirmacionOperador(
          operador.email,
          operador.nombre_completo,
          transferenciaCompleta,
          pdfBuffer
        );
        console.log('Email enviado a operador:', operador.email);
      }

    } catch (error) {
      console.error('Error procesando comprobante y notificaciones:', error);
      throw error;
    }
  }
}

module.exports = CrearTransferencia;