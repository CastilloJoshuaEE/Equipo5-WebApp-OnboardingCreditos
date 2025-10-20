const SolicitudModel=require('../modelos/SolicitudModel');
const DocumentoModel=require('../modelos/DocumentoModel');
const VerificacionKycModel = require('../modelos/VerificacionKycModel');
const OperadorController=require('../controladores/OperadorController')
const Notificaciones = require('../controladores/NotificacionesController')
const { supabase } = require('../config/conexion');
const { supabaseAdmin } = require('../config/supabaseAdmin');
const diditService = require('../servicios/diditService');

class SolicitudesController {
  // Crear solicitud de crédito
  static async crearSolicitud(req, res) {
    try {
      const {
        monto,
        plazo_meses,
        proposito,
        moneda = 'ARS'
      } = req.body;

      const solicitante_id = req.usuario.id;

      // Validaciones
      if (!monto || !plazo_meses || !proposito) {
        return res.status(400).json({
          success: false,
          message: 'Monto, plazo en meses y propósito son requeridos'
        });
      }

      // Generar número de solicitud único
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
      const numeroSolicitud = `SOL-${timestamp}-${randomStr}`;

      const solicitudData = {
        numero_solicitud: numeroSolicitud,
        solicitante_id,
        monto: parseFloat(monto),
        plazo_meses: parseInt(plazo_meses),
        proposito: proposito.trim(),
        moneda,
        estado: 'borrador',
        nivel_riesgo: 'medio',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const solicitud = await SolicitudModel.create(solicitudData);

      res.status(201).json({
        success: true,
        message: 'Solicitud de crédito creada exitosamente',
        data: solicitud
      });

    } catch (error) {
      console.error('. Error creando solicitud:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear solicitud'
      });
    }
  }

  // Enviar solicitud para revisión
// En SolicitudesController.js - método enviarSolicitud
static async enviarSolicitud(req, res) {
  try {
    const { solicitud_id } = req.params;
    const documentosCompletos = await DocumentoModel.verificarDocumentosObligatorios(solicitud_id);
    
    if (!documentosCompletos.completos) {
      return res.status(400).json({
        success: false,
        message: `Documentos obligatorios faltantes: ${documentosCompletos.documentosFaltantes.join(', ')}`
      });
    }

    // Actualizar estado de la solicitud
    const solicitud = await SolicitudModel.cambiarEstado(solicitud_id, 'enviado');

    // Calcular nivel de riesgo
    await SolicitudesController.calcularNivelRiesgo(solicitud_id);

    // Asignar operador automáticamente usando la función de la base de datos
    const { supabase } = require('../config/conexion');
    const { data: operadorAsignado, error: asignacionError } = await supabase
      .rpc('asignar_operador_automatico', { p_solicitud_id: solicitud_id });

    if (asignacionError) {
      console.error('Error asignando operador:', asignacionError);
      throw new Error('No se pudo asignar un operador automáticamente');
    }

    console.log(`Operador asignado: ${operadorAsignado}`);

    res.json({
      success: true,
      message: 'Solicitud enviada exitosamente para revisión',
      data: {
        ...solicitud,
        operador_asignado: operadorAsignado
      }
    });

  } catch (error) {
    console.error('Error enviando solicitud:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al enviar solicitud'
    });
  }
}
  // Obtener mis solicitudes
  static async obtenerMisSolicitudes(req, res) {
    try {
      const solicitante_id = req.usuario.id;
      const solicitudes = await SolicitudModel.findBySolicitanteId(solicitante_id);

      res.json({
        success: true,
        data: solicitudes
      });

    } catch (error) {
      console.error('. Error obteniendo solicitudes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener solicitudes'
      });
    }
  }

  // Obtener todas las solicitudes (para operadores)
  static async obtenerTodasSolicitudes(req, res) {
    try {
      const { estado, nivel_riesgo, page = 1, limit = 10 } = req.query;

      const filtros = {};
      if (estado) filtros.estado = estado;
      if (nivel_riesgo) filtros.nivel_riesgo = nivel_riesgo;
      if (page && limit) {
        filtros.page = parseInt(page);
        filtros.limit = parseInt(limit);
      }

      const { data: solicitudes, total } = await SolicitudModel.findAll(filtros);

      res.json({
        success: true,
        data: solicitudes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('. Error obteniendo todas las solicitudes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener solicitudes'
      });
    }
  }

  // Obtener detalle de una solicitud específica
  static async obtenerSolicitudDetalle(req, res) {
    try {
      const { solicitud_id } = req.params;

      const solicitud = await SolicitudModel.findById(solicitud_id);

      // Verificar permisos
      const tienePermiso = await SolicitudModel.verificarPermiso(
        solicitud_id, 
        req.usuario.id, 
        req.usuario.rol
      );

      if (!tienePermiso) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver esta solicitud'
        });
      }

      // Obtener documentos asociados
      const documentos = await DocumentoModel.findBySolicitudId(solicitud_id);
      const verificaciones = await VerificacionKycModel.findBySolicitudId(solicitud_id);

      res.json({
        success: true,
        data: {
          ...solicitud,
          documentos,
          verificaciones_kyc: verificaciones
        }
      });

    } catch (error) {
      console.error('. Error obteniendo detalle de solicitud:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener detalle de solicitud'
      });
    }
  }

  // Asignar operador a una solicitud
  static async asignarOperador(solicitudId) {
     try {
        // Buscar operador con menos solicitudes pendientes
        const { data: operadores, error } = await supabase
            .from('operadores')
            .select(`
                id,
                nivel,
                usuarios!inner(nombre_completo, cuenta_activa),
                solicitudes_credito!left(
                    id,
                    estado
                )
            `)
            .eq('usuarios.cuenta_activa', true)
            .eq('nivel', 'analista');

        if (error) throw error;

        // Contar solicitudes pendientes por operador
        const operadoresConCarga = operadores.map(operador => {
            const solicitudesPendientes = operador.solicitudes_credito?.filter(
                sol => sol.estado === 'en_revision' || sol.estado === 'pendiente_info'
            ) || [];
            
            return {
                ...operador,
                carga: solicitudesPendientes.length
            };
        });

        // Ordenar por carga (menos solicitudes primero) y aleatorio si hay empate
        operadoresConCarga.sort((a, b) => {
            if (a.carga === b.carga) {
                return Math.random() - 0.5; // Aleatorio si hay empate
            }
            return a.carga - b.carga;
        });

        const operadorAsignado = operadoresConCarga[0]?.id;

        if (!operadorAsignado) {
            throw new Error('No hay operadores disponibles para asignar');
        }

        // Asignar operador a la solicitud
        await supabase
            .from('solicitudes_credito')
            .update({
                operador_id: operadorAsignado,
                estado: 'en_revision',
                updated_at: new Date().toISOString()
            })
            .eq('id', solicitudId);

        console.log(`. Operador ${operadorAsignado} asignado a solicitud ${solicitudId}`);

        return operadorAsignado;

    } catch (error) {
        console.error('. Error asignando operador automático:', error);
        throw error;
    }
  }

  // Aprobar solicitud de crédito
  static async aprobarSolicitud(req, res) {
    try {
      const { solicitud_id } = req.params;
      const { comentarios, condiciones } = req.body;

      if (req.usuario.rol !== 'operador') {
        return res.status(403).json({
          success: false,
          message: 'Solo los operadores pueden aprobar solicitudes'
        });
      }

      const datosAdicionales = {
        comentarios: comentarios || 'Solicitud aprobada',
        operador_id: req.usuario.id
      };

      const solicitud = await SolicitudModel.cambiarEstado(solicitud_id, 'aprobado', datosAdicionales);

      // Registrar condiciones si se proporcionan
      if (condiciones) {
        await this.registrarCondicionesAprobacion(solicitud_id, condiciones, req.usuario.id);
      }

      res.json({
        success: true,
        message: 'Solicitud aprobada exitosamente',
        data: solicitud
      });

    } catch (error) {
      console.error('. Error aprobando solicitud:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al aprobar solicitud'
      });
    }
  }

  // Rechazar solicitud de crédito
  static async rechazarSolicitud(req, res) {
    try {
      const { solicitud_id } = req.params;
      const { motivo_rechazo } = req.body;

      if (!motivo_rechazo) {
        return res.status(400).json({
          success: false,
          message: 'Motivo del rechazo es requerido'
        });
      }

      if (req.usuario.rol !== 'operador') {
        return res.status(403).json({
          success: false,
          message: 'Solo los operadores pueden rechazar solicitudes'
        });
      }

      const datosAdicionales = {
        motivo_rechazo,
        operador_id: req.usuario.id
      };

      const solicitud = await SolicitudModel.cambiarEstado(solicitud_id, 'rechazado', datosAdicionales);

      res.json({
        success: true,
        message: 'Solicitud rechazada',
        data: solicitud
      });

    } catch (error) {
      console.error('. Error rechazando solicitud:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al rechazar solicitud'
      });
    }
  }

  // Obtener estadísticas de solicitudes
  static async obtenerEstadisticas(req, res) {
    try {
      if (req.usuario.rol !== 'operador') {
        return res.status(403).json({
          success: false,
          message: 'Solo los operadores pueden ver las estadísticas'
        });
      }

      const estadisticas = await SolicitudModel.getEstadisticas();

      res.json({
        success: true,
        data: estadisticas
      });

    } catch (error) {
      console.error('. Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas'
      });
    }
  }

  // Métodos auxiliares privados
static async calcularNivelRiesgo(solicitudId) {
  try {
    // Obtener datos de la solicitud y documentos
    const { data: solicitud, error: solError } = await supabase
      .from('solicitudes_credito')
      .select('*')
      .eq('id', solicitudId)
      .single();

    if (solError) throw solError;

    const { data: documentos, error: docsError } = await supabase
      .from('documentos')
      .select('*')
      .eq('solicitud_id', solicitudId);

    if (docsError) throw docsError;

    let puntajeRiesgo = 50; // Puntaje base

    // Factores de evaluación
    const factores = {
      monto: solicitud.monto > 1000000 ? -10 : 5,
      plazo: solicitud.plazo_meses > 36 ? -5 : 2,
      documentosCompletos: documentos.length >= 3 ? 10 : -15,
      documentosValidados: documentos.filter(d => d.estado === 'validado').length >= 3 ? 15 : -20
    };

    // Calcular puntaje final
    puntajeRiesgo += Object.values(factores).reduce((sum, factor) => sum + factor, 0);

    // Determinar nivel de riesgo
    let nivelRiesgo;
    if (puntajeRiesgo >= 70) nivelRiesgo = 'bajo';
    else if (puntajeRiesgo >= 40) nivelRiesgo = 'medio';
    else nivelRiesgo = 'alto';

    // Actualizar solicitud
    const { error: updateError } = await supabase
      .from('solicitudes_credito')
      .update({
        nivel_riesgo: nivelRiesgo,
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitudId);

    if (updateError) throw updateError;

    console.log(`. Nivel de riesgo calculado: ${nivelRiesgo} (puntaje: ${puntajeRiesgo})`);

  } catch (error) {
    console.error('. Error calculando nivel de riesgo:', error);
    throw error; // Propagar el error para manejo superior
  }
}
  // Solicitar información adicional
  static async solicitarInformacionAdicional(req, res) {
    try {
      const { solicitud_id } = req.params;
      const { informacion_solicitada, plazo_dias = 7 } = req.body;

      if (!informacion_solicitada) {
        return res.status(400).json({
          success: false,
          message: 'Información solicitada es requerida'
        });
      }

      console.log(`. Solicitando información adicional para: ${solicitud_id}`);

      // Actualizar estado de la solicitud
      const solicitud = await SolicitudModel.cambiarEstado(solicitud_id, 'pendiente_info', {
        comentarios: `Información adicional solicitada: ${informacion_solicitada}`
      });

      // Registrar la solicitud de información
      await this.registrarSolicitudInformacion(solicitud_id, informacion_solicitada, plazo_dias, req.usuario.id);

      console.log(`. Información adicional solicitada para solicitud ${solicitud_id}`);

      res.json({
        success: true,
        message: 'Información adicional solicitada exitosamente',
        data: solicitud
      });

    } catch (error) {
      console.error('. Error solicitando información adicional:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al solicitar información adicional'
      });
    }
  }

  // Iniciar verificación KYC con Didit
  static async iniciarVerificacionKYC(req, res) {
    try {
      const { solicitud_id } = req.params;

      console.log(`🔐 Iniciando verificación KYC para solicitud: ${solicitud_id}`);

      // Obtener datos del solicitante
      const solicitud = await SolicitudModel.findById(solicitud_id);
      
      if (!solicitud) {
        return res.status(404).json({
          success: false,
          message: 'Solicitud no encontrada'
        });
      }

      // Obtener datos del usuario
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', solicitud.solicitante_id)
        .single();

      if (usuarioError || !usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Obtener datos de la empresa
      const { data: solicitante, error: solicitanteError } = await supabase
        .from('solicitantes')
        .select('nombre_empresa')
        .eq('id', solicitud.solicitante_id)
        .single();

      // Crear sesión de verificación en Didit
      const resultado = await diditService.createVerificationSession({
        userId: usuario.id,
        email: usuario.email,
        phone: usuario.telefono,
        firstName: usuario.nombre_completo.split(' ')[0],
        lastName: usuario.nombre_completo.split(' ').slice(1).join(' '),
        companyName: solicitante?.nombre_empresa || 'Empresa'
      });

      if (!resultado.success) {
        throw new Error(resultado.error);
      }

      // Guardar referencia de la sesión
      await VerificacionKycModel.create({
        solicitud_id,
        session_id: resultado.sessionId,
        estado: 'pendiente',
        proveedor: 'didit',
        created_at: new Date().toISOString()
      });

      console.log(`. Verificación KYC iniciada: ${resultado.sessionId}`);

      res.json({
        success: true,
        message: 'Verificación KYC iniciada exitosamente',
        data: {
          verificationUrl: resultado.verificationUrl,
          sessionId: resultado.sessionId
        }
      });

    } catch (error) {
      console.error('. Error iniciando verificación KYC:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al iniciar verificación KYC'
      });
    }
  }

  // Métodos auxiliares privados
  static async registrarSolicitudInformacion(solicitudId, informacionSolicitada, plazoDias, operadorId) {
    try {
      const { supabase } = require('../config/conexion');
      
      await supabase
        .from('solicitudes_informacion')
        .insert({
          solicitud_id: solicitudId,
          informacion_solicitada: informacionSolicitada,
          plazo_dias: parseInt(plazoDias),
          estado: 'pendiente',
          solicitado_por: operadorId,
          fecha_limite: new Date(Date.now() + plazoDias * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('. Error registrando solicitud de información:', error);
    }
  }
}
module.exports = SolicitudesController;
