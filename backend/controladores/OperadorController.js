const {supabase}= require('../config/conexion');
const  BCRAService= require('../servicios/BCRAService');
class OperadorController{
    //Obtener dashboard del operador con filtros
static async obtenerDashboard(req, res) {
  try {
    const operadorId = req.usuario.id;
    const { estado, fecha_desde, fecha_hasta, nivel_riesgo } = req.query;

    console.log(`. Obteniendo dashboard para operador: ${operadorId}`, { 
      estado, fecha_desde, fecha_hasta, nivel_riesgo 
    });

    let query = supabase
      .from('solicitudes_credito')
      .select(`
        *,
        solicitantes: solicitantes!solicitante_id(
          nombre_empresa,
          cuit,
          representante_legal,
          usuarios:usuarios!inner(nombre_completo, email, telefono)
        )
      `)
      .eq('operador_id', operadorId)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (estado) query = query.eq('estado', estado);
    if (nivel_riesgo) query = query.eq('nivel_riesgo', nivel_riesgo);
    if (fecha_desde) query = query.gte('created_at', fecha_desde);
    if (fecha_hasta) query = query.lte('created_at', fecha_hasta);

    const { data: solicitudes, error } = await query;

    if (error) {
      console.error('. Error en consulta de solicitudes:', error);
      throw error;
    }

    console.log(`. Solicitudes encontradas: ${solicitudes?.length || 0}`);

    // Obtener estadísticas del operador
    const { data: stats, error: statsError } = await supabase
      .from('solicitudes_credito')
      .select('estado')
      .eq('operador_id', operadorId);

    if (statsError) {
      console.error('. Error obteniendo estadísticas:', statsError);
    }

    const estadisticas = {
      total: solicitudes?.length || 0,
      en_revision: stats?.filter(s => s.estado === 'en_revision').length || 0,
      pendiente_info: stats?.filter(s => s.estado === 'pendiente_info').length || 0,
      aprobado: stats?.filter(s => s.estado === 'aprobado').length || 0,
      rechazado: stats?.filter(s => s.estado === 'rechazado').length || 0
    };

    res.json({
      success: true,
      data: {
        solicitudes: solicitudes || [],
        estadisticas,
        total: solicitudes?.length || 0
      }
    });

  } catch (error) {
    console.error('. Error en obtenerDashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el dashboard del operador',
      error: error.message
    });
  }
}

// Iniciar revision de solicitud (abrir modal de acciones) - MEJORADO
static async iniciarRevision(req, res) {
  try {
    const { solicitud_id } = req.params;
    const operadorId = req.usuario.id;
    
    console.log(`Operador ${operadorId} iniciando revisión de solicitud ${solicitud_id}`);
 // Verificar que la solicitud está asignada al operador
        const { data: solicitud, error } = await supabase
            .from('solicitudes_credito')
            .select(`
                *,
                solicitantes: solicitantes!solicitante_id(
                    nombre_empresa,
                    cuit,
                    representante_legal,
                    domicilio,
                    usuarios:usuarios!inner(nombre_completo, email, telefono)
                )
            `)
            .eq('id', solicitud_id)
            .eq('operador_id', operadorId)
            .single();

        if (error || !solicitud) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada o no asignada a este operador'
            });
        }

        // Obtener documentos de la solicitud
        const { data: documentos } = await supabase
            .from('documentos')
            .select('*')
            .eq('solicitud_id', solicitud_id)
            .order('tipo', { ascending: true });

        // Consultar BCRA si existe CUIT
        let infoBCRA = null;
        if (solicitud.solicitantes?.cuit) {
            try {
                const cuitLimpio = solicitud.solicitantes.cuit.replace(/\D/g, '');
                infoBCRA = await BCRAService.consultarDeudas(cuitLimpio);
                
                if (infoBCRA.success) {
                    await supabase
                        .from('auditoria')
                        .insert({
                            usuario_id: operadorId,
                            solicitud_id: solicitud_id,
                            accion: 'consulta_bcra',
                            detalle: `Consulta BCRA realizada para CUIT: ${solicitud.solicitantes.cuit}`,
                            created_at: new Date().toISOString()
                        });
                }
            } catch (bcraError) {
                console.warn('. Error consultando BCRA:', bcraError.message);
                infoBCRA = { success: false, error: bcraError.message };
            }
        }

        // Calcular scoring de documentos (20% cada uno)
        const scoring = await OperadorController.calcularScoringDocumentos(documentos || []);

        // Actualizar estado si aún no está en revisión
        if (solicitud.estado === 'enviado') {
            await supabase
                .from('solicitudes_credito')
                .update({
                    estado: 'en_revision',
                    updated_at: new Date().toISOString()
                })
                .eq('id', solicitud_id);
        }

        return res.json({
            success: true,
            data: {
                solicitud: {
                    ...solicitud,
                    estado: 'en_revision' // Actualizar estado en respuesta
                },
                documentos: documentos || [],
                infoBCRA,
                scoring,
                solicitante: solicitud.solicitantes || null
            }
        });

    } catch (error) {
        console.error('. Error en iniciarRevisionSolicitud:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al iniciar la revisión'
        });
    }
}
    //Calcular scoring de documentos (20% cada uno de 5 documentos)
static async calcularScoringDocumentos(documentos) {
    const documentosRequeridos = [
        'dni',
        'cuit', 
        'comprobante_domicilio',
        'balance_contable',
        'declaracion_impuestos'
    ];
    
    let scoring = {
        total: 0,
        desglose: {},
        documentosFaltantes: [],
        documentosValidados: 0,
        documentosPendientes: 0,
        documentosSubidos: 0
    };

    documentosRequeridos.forEach(tipo => {
        const doc = documentos.find(d => d.tipo === tipo);
        
        if (doc) {
            // Documento existe en la base de datos
            if (doc.estado === 'validado') {
                scoring.desglose[tipo] = {
                    puntaje: 20,
                    estado: 'validado',
                    documento_id: doc.id,
                    nombre_archivo: doc.nombre_archivo,
                    ruta_storage: doc.ruta_storage
                };
                scoring.total += 20;
                scoring.documentosValidados++;
            } else {
                // Estado pendiente o rechazado
                scoring.desglose[tipo] = {
                    puntaje: 0,
                    estado: doc.estado,
                    documento_id: doc.id,
                    nombre_archivo: doc.nombre_archivo,
                    ruta_storage: doc.ruta_storage
                };
                scoring.documentosPendientes++;
            }
            scoring.documentosSubidos++;
        } else {
            // Documento no existe en la base de datos
            scoring.desglose[tipo] = {
                puntaje: 0,
                estado: 'pendiente' // Cambiado de 'faltante' a 'pendiente'
            };
            scoring.documentosPendientes++;
        }
    });

    return scoring;
}
    //Validar documento específico( balance contable PDF)
    static async validarBalanceContable(req, res){
        try{
            const {solicitud_id, documento_id}= req.params;
            const {validado, comentarios, informacion_extraida} = req.body;
            console.log(`Validando balance contable para solicitud ${solicitud_id}`);
            //Actualizar estado del documento
            const{data:documento, error} = await supabase
                .from('documentos')
                .update({
                    estado: validado ? 'validado': 'rechazado',
                    comentarios,
                    informacion_extraida: informacion_extraida || null,
                    validado_en: new Date().toISOString
                })
                .eq('id', documento_id)
                .eq('solicitud_id', solicitud_id)
                .eq('tipo', 'balance_contable')
                .select()
                .single();
            if(error) throw error;
            //Recalcular scoring total
            await this.recalcularScoringSolicitud(solicitud_id);
            //Auditoría
            await supabase
                .from('auditoria')
                .insert({
                    usuario_id: req.usuario.id,
                    solicitud_id: solicitud_id,
                    accion: 'validar_documento',
                    detalle: `Balanace contable ${validado? ' validado': 'rechazado'}`,
                    estado_anterior:'pendiente',
                    estado_nuevo: validado? 'validado': 'rechazado'
                });
            res.json({
                success:true,
                message: `Documento ${validado? 'validado': 'rechazado'} exitosamente`,
                data:documento
            });

        }catch(error){
            console.error('Error en validarBalanceContable:', error);
            res.status(500).json({
                success: false,
                message: 'Error al validar el documento'
            });
        }
    }
    //Recalcular socirng total de la solicitud
    static async recalcularScoringSolicitud(solicitudId){
        try{
            const{data:documentos}= await supabase
            .from('documentos')
            .select('*')
            .eq('solicitud_id', solicitudId);

            const scoring =await this.calcularScoringDocumentos(documentos || []);
            //Actualizar nivel de riesgo basado en scoring
            let nivel_riesgo = 'alto';
            if(scoring.total>=80) nivel_riesgo='bajo';
            else if(scoring.total>=60) nivel_riesgo='medio';
            await supabase
            .from('solicitudes_credito')
            .update({
                nivel_riesgo: nivel_riesgo,
                update_at: new Date().toISOString
            })
            .eq('id', solicitudId);
            return scoring;
        }catch(error){
            console.error('Error recalculando scoring:', error);
        }
    }


}
module.exports= OperadorController ;