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


    // Validar que la solicitud existe y está aprobada
    const { data: solicitud, error: solicitudError } = await this.supabase
      .from('solicitudes_credito')
      .select('*')
      .eq('id', solicitud_id)
      .single();

    if (solicitudError || !solicitud) {
      return {
        success: false,
        status: 404,
        message: 'Solicitud no encontrada'
      };
    }
    
    // Intentar obtener el contrato de varias maneras
    let contrato = null;
    
    // Opción 1: Buscar directamente por solicitud_id
    const { data: contratoPorSolicitud, error: errorSolicitud } = await this.supabase
      .from('contratos')
      .select('id, numero_contrato, estado, solicitud_id, firma_digital_id')
      .eq('solicitud_id', solicitud_id)
      .maybeSingle();
    
    if (contratoPorSolicitud) {
      contrato = contratoPorSolicitud;
    }
    
    // Opción 2: Buscar a través de firmas_digitales
    if (!contrato) {
      const { data: firma } = await this.supabase
        .from('firmas_digitales')
        .select('contrato_id')
        .eq('solicitud_id', solicitud_id)
        .eq('estado', 'firmado_completo')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (firma?.contrato_id) {
        const { data: contratoPorFirma } = await this.supabase
          .from('contratos')
          .select('id, numero_contrato, estado, solicitud_id, firma_digital_id')
          .eq('id', firma.contrato_id)
          .maybeSingle();
        
        if (contratoPorFirma) {
          contrato = contratoPorFirma;
        }
      }
    }
    
    // Opción 3: Buscar cualquier contrato relacionado (por si el solicitud_id es incorrecto)
    if (!contrato) {
      const { data: contratos } = await this.supabase
        .from('contratos')
        .select('id, numero_contrato, estado, solicitud_id')
        .eq('estado', 'firmado_completo')
        .limit(5);
      
      if (contratos && contratos.length > 0) {
        console.log('Contratos encontrados (para depuración):', contratos.map(c => c.solicitud_id));
      }
    }

    if (!contrato) {
      console.error(' No se encontró contrato para solicitud:', solicitud_id);
      
      // Log de depuración para verificar si hay contratos en la base de datos
      const { data: todosContratos } = await this.supabase
        .from('contratos')
        .select('id, solicitud_id, estado')
        .limit(10);
      
      
      return {
        success: false,
        status: 400,
        message: 'No existe un contrato válido para esta solicitud. Por favor, complete el proceso de firma digital primero.'
      };
    }

    // Verificar que el contrato esté firmado
    const estadosValidos = ['firmado_completo', 'vigente', 'firmado_solicitante', 'firmado_operador'];
    if (!estadosValidos.includes(contrato.estado)) {
      // Verificar también a través de la firma digital
      const { data: firmaCompleta } = await this.supabase
        .from('firmas_digitales')
        .select('estado')
        .eq('solicitud_id', solicitud_id)
        .eq('estado', 'firmado_completo')
        .maybeSingle();
      
      if (!firmaCompleta) {
        return {
          success: false,
          status: 400,
          message: `El contrato debe estar completamente firmado antes de realizar la transferencia. Estado actual del contrato: ${contrato.estado}`
        };
      }
    }

    // Validar contacto bancario
    const { data: contacto, error: contactoError } = await this.supabase
      .from('contactos_bancarios')
      .select('*')
      .eq('id', contacto_bancario_id)
      .single();

    if (contactoError || !contacto) {
      return {
        success: false,
        status: 404,
        message: 'Contacto bancario no encontrado'
      };
    }

    // Verificar que el contacto pertenece al solicitante
    if (contacto.solicitante_id !== solicitud.solicitante_id) {
      return {
        success: false,
        status: 403,
        message: 'El contacto bancario no pertenece al solicitante de esta solicitud'
      };
    }

    // Verificar que no exista una transferencia previa para esta solicitud
    const transferenciaExistente = await this.transferenciaRepository.verificarTransferenciaExistente(solicitud_id);
    if (transferenciaExistente) {
      return {
        success: false,
        status: 400,
        message: 'Ya existe una transferencia en proceso o completada para esta solicitud'
      };
    }

    const numero_comprobante = TransferenciaBancaria.generarNumeroComprobante();

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
      estado: TransferenciaBancaria.ESTADOS.PENDIENTE, // Cambiar a PENDIENTE para que el procesamiento tenga sentido
      procesado_por: operador_id,
      fecha_procesamiento: new Date().toISOString()
    });

    transferenciaEntity.validar();


    const transferencia = await this.transferenciaRepository.crear(transferenciaEntity.toJSON());


    // INICIAR PROCESAMIENTO AUTOMÁTICO
    try {
      
      const simulador = new SimularProcesamientoTransferencia(
        this.transferenciaRepository,
        this.notificacionService,
        this.supabase
      );
      
      await simulador.execute(transferencia.id);
      
      
    } catch (procesamientoError) {
      console.error('Error en procesamiento automático:', procesamientoError);
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
}

module.exports = CrearTransferencia;