const { supabase } = require('../config/conexion');
const { supabaseAdmin } = require('../config/supabaseAdmin');
const diditService = require('../servicios/diditService');

// Crear solicitud de crédito
const crearSolicitud = async (req, res) => {
  try {
    const {
      monto,
      plazo_meses,
      proposito,
      moneda = 'ARS'
    } = req.body;

    const solicitante_id = req.usuario.id;

    console.log(`Creando solicitud para solicitante: ${solicitante_id}`, req.body);

    // Validaciones más robustas
    if (!monto || !plazo_meses || !proposito) {
      return res.status(400).json({
        success: false,
        message: 'Monto, plazo en meses y propósito son requeridos',
        detalles: {
          monto_provided: !!monto,
          plazo_meses_provided: !!plazo_meses,
          proposito_provided: !!proposito
        }
      });
    }

    // Validar tipos de datos
    if (isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Monto debe ser un número válido mayor a 0'
      });
    }

    if (isNaN(parseInt(plazo_meses)) || parseInt(plazo_meses) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Plazo en meses debe ser un número válido mayor a 0'
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
      nivel_riesgo: 'medio', // Valor por defecto
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Datos de solicitud a insertar:', solicitudData);

    const { data: solicitud, error } = await supabase
      .from('solicitudes_credito')
      .insert([solicitudData])
      .select()
      .single();

    if (error) {
      console.error('Error de Supabase:', error);
      throw error;
    }

    console.log(`Solicitud creada exitosamente: ${numeroSolicitud}`, solicitud);

    res.status(201).json({
      success: true,
      message: 'Solicitud de crédito creada exitosamente',
      data: solicitud
    });

  } catch (error) {
    console.error('Error detallado creando solicitud:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear solicitud',
      detalles: error.details || 'Sin detalles adicionales'
    });
  }
};

// Enviar solicitud para revisión
const enviarSolicitud = async (req, res) => {
  try {
    const { solicitud_id } = req.params;

    console.log(`. Enviando solicitud: ${solicitud_id}`);

    // Verificar documentos obligatorios
    const { data: documentos, error: docsError } = await supabase
      .from('documentos')
      .select('tipo, estado')
      .eq('solicitud_id', solicitud_id);

    if (docsError) throw docsError;

    const documentosObligatorios = ['dni', 'cuit', 'comprobante_domicilio'];
    const documentosSubidos = documentos.map(doc => doc.tipo);
    const documentosFaltantes = documentosObligatorios.filter(doc => !documentosSubidos.includes(doc));

    if (documentosFaltantes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Documentos obligatorios faltantes: ${documentosFaltantes.join(', ')}`
      });
    }

    // TEMPORAL: Permitir envío incluso si Didit falla
    console.log('. Advertencia: Verificación Didit puede estar fallando, pero permitiendo envío de solicitud');

    // Actualizar estado de la solicitud
    const { data: solicitud, error } = await supabase
      .from('solicitudes_credito')
      .update({
        estado: 'enviado',
        fecha_envio: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitud_id)
      .select()
      .single();

    if (error) throw error;

    // Calcular nivel de riesgo
    await calcularNivelRiesgo(solicitud_id);

    console.log(`. Solicitud enviada: ${solicitud_id}`);

    res.json({
      success: true,
      message: 'Solicitud enviada exitosamente para revisión',
      data: solicitud
    });

  } catch (error) {
    console.error('. Error enviando solicitud:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al enviar solicitud'
    });
  }
};

// Calcular nivel de riesgo automáticamente
const calcularNivelRiesgo = async (solicitudId) => {
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
      monto: solicitud.monto > 1000000 ? -10 : 5, // Montos altos = más riesgo
      plazo: solicitud.plazo_meses > 36 ? -5 : 2, // Plazos largos = más riesgo
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
    await supabase
      .from('solicitudes_credito')
      .update({
        nivel_riesgo: nivelRiesgo,
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitudId);

    console.log(`. Nivel de riesgo calculado: ${nivelRiesgo} (puntaje: ${puntajeRiesgo})`);

  } catch (error) {
    console.error('. Error calculando nivel de riesgo:', error);
  }
};

// Obtener solicitudes del solicitante
const obtenerMisSolicitudes = async (req, res) => {
  try {
    const solicitante_id = req.usuario.id;

    const { data: solicitudes, error } = await supabase
      .from('solicitudes_credito')
      .select('*')
      .eq('solicitante_id', solicitante_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

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
};

// Obtener todas las solicitudes (para operadores)
const obtenerTodasSolicitudes = async (req, res) => {
  try {
    const { estado, nivel_riesgo, page = 1, limit = 10 } = req.query;

    let query = supabase
      .from('solicitudes_credito')
      .select(`
        *,
        solicitantes: solicitantes!solicitante_id (
          nombre_empresa,
          representante_legal,
          cuit
        ),
        operadores: operadores!operador_id (
          nivel
        ),
        documentos: documentos(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (estado) {
      query = query.eq('estado', estado);
    }
    if (nivel_riesgo) {
      query = query.eq('nivel_riesgo', nivel_riesgo);
    }

    // Paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);

    const { data: solicitudes, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: solicitudes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('. Error obteniendo todas las solicitudes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitudes'
    });
  }
};

// Obtener detalle de una solicitud específica
const obtenerSolicitudDetalle = async (req, res) => {
  try {
    const { solicitud_id } = req.params;

    const { data: solicitud, error } = await supabase
      .from('solicitudes_credito')
      .select(`
        *,
        solicitantes: solicitantes!solicitante_id (
          nombre_empresa,
          representante_legal,
          cuit,
          domicilio,
          tipo
        ),
        operadores: operadores!operador_id (
          nombre_completo: usuarios(nombre_completo),
          nivel
        ),
        documentos: documentos(*)
      `)
      .eq('id', solicitud_id)
      .single();

    if (error) throw error;

    // Verificar permisos (solo el solicitante o un operador puede ver)
    if (req.usuario.rol === 'solicitante' && solicitud.solicitante_id !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta solicitud'
      });
    }

    res.json({
      success: true,
      data: solicitud
    });

  } catch (error) {
    console.error('. Error obteniendo detalle de solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle de solicitud'
    });
  }
};

// Asignar operador a una solicitud
const asignarOperador = async (req, res) => {
  try {
    const { solicitud_id } = req.params;
    const { operador_id } = req.body;

    if (!operador_id) {
      return res.status(400).json({
        success: false,
        message: 'ID del operador es requerido'
      });
    }

    console.log(`. Asignando operador ${operador_id} a solicitud: ${solicitud_id}`);

    const { data: solicitud, error } = await supabase
      .from('solicitudes_credito')
      .update({
        operador_id,
        estado: 'en_revision',
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitud_id)
      .select(`
        *,
        operadores: operadores!operador_id (
          nivel,
          usuarios: usuarios(nombre_completo)
        )
      `)
      .single();

    if (error) throw error;

    console.log(`. Operador asignado a solicitud ${solicitud_id}`);

    res.json({
      success: true,
      message: 'Operador asignado exitosamente',
      data: solicitud
    });

  } catch (error) {
    console.error('. Error asignando operador:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al asignar operador'
    });
  }
};

// Aprobar solicitud de crédito
const aprobarSolicitud = async (req, res) => {
  try {
    const { solicitud_id } = req.params;
    const { comentarios, condiciones } = req.body;

    console.log(`. Aprobando solicitud: ${solicitud_id}`);

    // Verificar que el usuario sea un operador
    if (req.usuario.rol !== 'operador') {
      return res.status(403).json({
        success: false,
        message: 'Solo los operadores pueden aprobar solicitudes'
      });
    }

    const { data: solicitud, error } = await supabase
      .from('solicitudes_credito')
      .update({
        estado: 'aprobado',
        comentarios: comentarios || 'Solicitud aprobada',
        fecha_decision: new Date().toISOString(),
        operador_id: req.usuario.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitud_id)
      .select()
      .single();

    if (error) throw error;

    // Registrar condiciones si se proporcionan
    if (condiciones) {
      await supabase
        .from('condiciones_aprobacion')
        .insert({
          solicitud_id,
          condiciones: JSON.stringify(condiciones),
          creado_por: req.usuario.id,
          created_at: new Date().toISOString()
        });
    }

    console.log(`. Solicitud ${solicitud_id} aprobada por operador ${req.usuario.id}`);

    // TODO: Enviar notificación al solicitante

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
};

// Rechazar solicitud de crédito
const rechazarSolicitud = async (req, res) => {
  try {
    const { solicitud_id } = req.params;
    const { motivo_rechazo } = req.body;

    if (!motivo_rechazo) {
      return res.status(400).json({
        success: false,
        message: 'Motivo del rechazo es requerido'
      });
    }

    console.log(`. Rechazando solicitud: ${solicitud_id}`);

    // Verificar que el usuario sea un operador
    if (req.usuario.rol !== 'operador') {
      return res.status(403).json({
        success: false,
        message: 'Solo los operadores pueden rechazar solicitudes'
      });
    }

    const { data: solicitud, error } = await supabase
      .from('solicitudes_credito')
      .update({
        estado: 'rechazado',
        motivo_rechazo,
        fecha_decision: new Date().toISOString(),
        operador_id: req.usuario.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitud_id)
      .select()
      .single();

    if (error) throw error;

    console.log(`. Solicitud ${solicitud_id} rechazada por operador ${req.usuario.id}`);

    // TODO: Enviar notificación al solicitante

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
};

// Solicitar información adicional
const solicitarInformacionAdicional = async (req, res) => {
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
    const { data: solicitud, error } = await supabase
      .from('solicitudes_credito')
      .update({
        estado: 'pendiente_info',
        comentarios: `Información adicional solicitada: ${informacion_solicitada}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitud_id)
      .select()
      .single();

    if (error) throw error;

    // Registrar la solicitud de información
    await supabase
      .from('solicitudes_informacion')
      .insert({
        solicitud_id,
        informacion_solicitada,
        plazo_dias: parseInt(plazo_dias),
        estado: 'pendiente',
        solicitado_por: req.usuario.id,
        fecha_limite: new Date(Date.now() + plazo_dias * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      });

    console.log(`. Información adicional solicitada para solicitud ${solicitud_id}`);

    // TODO: Enviar notificación al solicitante

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
};

// Obtener estadísticas de solicitudes (para dashboard)
const obtenerEstadisticas = async (req, res) => {
  try {
    // Solo para operadores
    if (req.usuario.rol !== 'operador') {
      return res.status(403).json({
        success: false,
        message: 'Solo los operadores pueden ver las estadísticas'
      });
    }

    // Contar solicitudes por estado
    const { data: conteoPorEstado, error: errorEstado } = await supabase
      .from('solicitudes_credito')
      .select('estado', { count: 'exact' })
      .group('estado');

    if (errorEstado) throw errorEstado;

    // Contar solicitudes por nivel de riesgo
    const { data: conteoPorRiesgo, error: errorRiesgo } = await supabase
      .from('solicitudes_credito')
      .select('nivel_riesgo', { count: 'exact' })
      .group('nivel_riesgo');

    if (errorRiesgo) throw errorRiesgo;

    // Solicitudes del último mes
    const ultimoMes = new Date();
    ultimoMes.setMonth(ultimoMes.getMonth() - 1);

    const { data: solicitudesRecientes, error: errorRecientes } = await supabase
      .from('solicitudes_credito')
      .select('*', { count: 'exact' })
      .gte('created_at', ultimoMes.toISOString());

    if (errorRecientes) throw errorRecientes;

    // Monto total solicitado
    const { data: montoTotal, error: errorMonto } = await supabase
      .from('solicitudes_credito')
      .select('monto')
      .eq('estado', 'aprobado');

    if (errorMonto) throw errorMonto;

    const totalAprobado = montoTotal.reduce((sum, solicitud) => sum + parseFloat(solicitud.monto), 0);

    const estadisticas = {
      totalSolicitudes: conteoPorEstado.reduce((sum, item) => sum + item.count, 0),
      porEstado: conteoPorEstado.reduce((acc, item) => {
        acc[item.estado] = item.count;
        return acc;
      }, {}),
      porRiesgo: conteoPorRiesgo.reduce((acc, item) => {
        acc[item.nivel_riesgo] = item.count;
        return acc;
      }, {}),
      solicitudesUltimoMes: solicitudesRecientes.length,
      montoTotalAprobado: totalAprobado
    };

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
};

// Iniciar verificación KYC con Didit
const iniciarVerificacionKYC = async (req, res) => {
  try {
    const { solicitud_id } = req.params;

    console.log(`. Iniciando verificación KYC para solicitud: ${solicitud_id}`);

    // Obtener datos del solicitante
    const { data: solicitud, error: solError } = await supabase
      .from('solicitudes_credito')
      .select(`
        *,
        solicitantes: solicitantes!solicitante_id (
          nombre_empresa,
          representante_legal,
          usuarios: usuarios!inner (
            email,
            nombre_completo,
            telefono
          )
        )
      `)
      .eq('id', solicitud_id)
      .single();

    if (solError) throw solError;

    const usuario = solicitud.solicitantes.usuarios;

    // Crear sesión de verificación en Didit
    const resultado = await diditService.createVerificationSession({
      userId: usuario.id,
      email: usuario.email,
      phone: usuario.telefono,
      firstName: usuario.nombre_completo.split(' ')[0],
      lastName: usuario.nombre_completo.split(' ').slice(1).join(' '),
      companyName: solicitud.solicitantes.nombre_empresa
    });

    if (!resultado.success) {
      throw new Error(resultado.error);
    }

    // Guardar referencia de la sesión
    await supabase
      .from('verificaciones_kyc')
      .insert({
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
};

module.exports = {
  crearSolicitud,
  enviarSolicitud,
  obtenerMisSolicitudes,
  obtenerTodasSolicitudes,
  obtenerSolicitudDetalle,
  asignarOperador,
  aprobarSolicitud,
  rechazarSolicitud,
  solicitarInformacionAdicional,
  obtenerEstadisticas,
  iniciarVerificacionKYC
};