// backend/application/use-cases/documentos/EvaluarDocumento.js
class EvaluarDocumento{
    constructor(documentoRepository, supabase, notificacionService){
        this.documentoRepository = documentoRepository;
        this.supabase = supabase;
        this.notificacionService = notificacionService;
    }
    async execute(documento_id, {criterios, comentarios, estado}, usuario){
console.log(`. Evaluando documento ${documento_id}`, { criterios, estado, comentarios });        // Obtener documento actual
        const documento = await this.documentoRepository.obtenerPorId(documento_id);
        if(!documento){
            return {
                success: false,
                status: 404,
                message: 'Documento no encontrado'
            };
        }
        // Calcular scoring basado en criterios aprobados
        const criteriosAprobados = Object.values(criterios).filter(Boolean).length;
        const totalCriterios = Object.keys(criterios).length;
        const porcentajeAprobado = (criteriosAprobados/totalCriterios)* 100;
        // Determinar estado automáticamente si no se proporciona
        let estadoFinal = estado;
        if( ! estadoFinal){
            if(porcentajeAprobado >=80){
                estadoFinal = 'validado';
            } else if (porcentajeAprobado >=60){
                estadoFinal = 'pendiente';
            } else {
                estadoFinal = 'rechazado';
            }
        }
        // Guardar evaluación
        const evaluacionData = {
            criterios_aprobados: criteriosAprobados,
            total_criterios: totalCriterios,
            porcentaje_aprobado: porcentajeAprobado,
            fecha_evaluacion: new Date().toISOString(),
            criterios_detallados: criterios,
            estado_final: estadoFinal,
            comentarios: comentarios,
            evaluado_por: usuario.id
        };
        await this.documentoRepository.registrarEvaluacion({
            solicitud_id: documento.solicitud_id,
            documento_id: documento_id,
            condiciones: evaluacionData,
            creado_por: usuario.id,
            created_at: new Date().toISOString()
        });
        const comentarioEvaluacion = comentarios && comentarios.trim()!== ''
        ? comentarios
        : `Evaluación: ${criteriosAprobados}/${totalCriterios} criterios aprobados (${porcentajeAprobado.toFixed(0)}%)`;
        const documentoActualizado = await this.documentoRepository.actualizar(documento_id,{
            estado: estadoFinal,
            comentarios: comentarioEvaluacion,
            validado_en: new Date().toISOString()
        });
        // Crear notificación
        await this.crearNotificacion(documento, estadoFinal, comentarios, criteriosAprobados, totalCriterios, porcentajeAprobado);
        return {
            success: true,
            message: 'Documento evaluado exitosamente',
            data: {
                documento: documentoActualizado,
                evaluacion: {
                    criterios_aprobados: criteriosAprobados,
                    total_criterios: totalCriterios,
                    porcentaje_aprobado: porcentajeAprobado,
                    estado: estadoFinal
                }
            }
        };
        


    }
    async crearNotificacion(documento, estadoFinal, comentarios, criteriosAprobados, totalCriterios, porcentajeAprobado){
        try {
            const { data: solicitudInfo} = await this.supabase
                .from('solicitudes_credito')
                .select('solicitante_id, numero_solicitud')
                .eq('id', documento.solicitante_id)
                .single();
            if(solicitudInfo){
                const notificacionData = {
                    usuario_id: solicitudInfo.solicitante_id,
                    solicitud_id: documento.solicitud_id,
                    tipo: 'documento_evaluado',
                    titulo: `Documento ${estadoFinal}`,
                    mensaje: `Tu documento ${documento.tipo} ha sido ${estadoFinal}. ${comentarios ? `Análisis: ${comentarios}`:''}`,
                    leida: false,
                    datos_adicionales: {
                        documento_tipo: documento.tipo,
                        estado: estadoFinal,
                        comentarios: comentarios,
                        solicitud_numero: solicitudInfo.numero_solicitud,
                        criterios_aprobados: criteriosAprobados,
                        total_criterios: totalCriterios,
                        porcentaje_aprobado: porcentajeAprobado
                    },
                    created_at: new Date().toISOString()
                };
                await this.supabase.from('notificaciones').insert([notificacionData]);
            }
        } catch (notifError) {
            console.warn('Error creando notificación:', notifError.message);
        }
    }
}
module.exports = EvaluarDocumento;
