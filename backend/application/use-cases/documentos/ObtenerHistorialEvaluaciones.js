// backend/application/use-cases/documentos/ObtenerHistorialEvaluaciones.js
class ObtenerHistorialEvaluaciones{
    constructor(documentoRepository){
        this.documentoRepository= documentoRepository;
    }
    async execute (documento_id){
        const evaluaciones = await this.documentoRepository.obtenerHistorialEvaluaciones(documento_id);
        const evaluacionesProcesadas= evaluaciones?.map(evaluacion=>{
            const condiciones = evaluacion.condiciones;
            let criteriosDetallados = {};
            if(condiciones && typeof condiciones === 'object'){
                if(condiciones.criterios_detallados && typeof condiciones.criterios_detallados=== 'object'){
                    criteriosDetallados = condiciones.criterios_detallados;
                } else {
                    Object.entries(condiciones).forEach(([key, value])=>{
                        if(typeof value === 'boolean'){
                            criteriosDetallados[key]= value;
                        }
                    });
                }
            }
            return {
                id: evaluacion.id,
                criterios: criteriosDetallados,
                comentarios: condiciones?.comentarios || evaluacion.condiciones?.comentarios,
                estado_final: condiciones?.estado_final,
                porcentaje_aprobado: condiciones?.porcentaje_aprobado,
                fecha_evaluacion: condiciones?.fecha_evaluacion || evaluacion.created_at,
                evaluado_por: evaluacion.usuario

            };
        }) || [];
        return {
            success: true,
            data: evaluacionesProcesadas
        };
    }
}
module.exports = ObtenerHistorialEvaluaciones;