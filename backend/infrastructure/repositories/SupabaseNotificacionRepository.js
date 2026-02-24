//backend/infrastructure/repositories/SupabaseNotificacionRepository.js
const NotificacionRepository = require('../../domain/repositories/NotificacionRepository');
const Notificacion = require('../../domain/entities/Notificacion');
class SupabaseNotificacionRepository extends NotificacionRepository{
    constructor(supabase, supabaseAdmin){
        super();
        this.supabase = supabase;
        this.supabaseAdmin = supabaseAdmin;
    }
    async crear(notificacionData){
        const { data, error}= await this.supabaseAdmin
            .from('notificaciones')
            .insert([notificacionData])
            .select()
            .single();
        if(error) throw new Error(`Error creando notificación: ${error.message}`);
        return new Notificacion(data);
    }
    async obtenerPorUsuario(usuarioId, filtros = {}){
        const { limit = 10, offset=0, leida} = filtros;
        let query = this.supabase
            .from('notificaciones')
            .select('*')
            .eq('usuario_id', usuarioId)
            .order('created_at', {ascending: false});
        if(leida !==undefined){
            query = query.ed('leida', leida);
        }
        query = query.range(offset, offset + limit - 1);
        const {data, error} = await query;
        if(error) throw error;
        return data.map(n=> new Notificacion(n));
    }
    async obtenerContador (usuarioId, leida = null){
        let query = this.supabase
            .from('notificaciones')
            .select('*', {count: 'exact', head:true})
            .eq('usuario_id', usuarioId);
        if(leida !== null){
            query = query.eq('leida', leida);
        }
        const { count, error} = await query;
        if(error) throw error;
        return count || 0;
    }
    async marcarComoLeida(id, usuarioId){
        const { data, error} = await this.supabase
            .from('notificaciones')
            .update({leida:true})
            .eq('id', id)
            .eq('usuario_id', usuarioId)
            .select();
        if(error) throw error;
        return data?.[0] ? new Notificacion(data[0]) : null;
    }
    async marcarTodasComoLeidas(usuarioId){
        const {error} = await this.supabase
            .from('notificaciones')
            .update({leida: true})
            .eq('usuario_id', usuarioId)
            .eq('leida', false);
        if(error) throw error;
        return true;
    }
    async verificarPropiedad(id, usuarioId){
        const { data, error} = await this.supabase
            .from('notificaciones')
            .select('usuario_id')
            .eq('id', id)
            .single();
        if(error) return false;
        return data?.usuario_id === usuarioId;
    }
    async crearParaFirma(solicitanteId, operadorId, solicitudId, firma){
        const notificaciones = [{
            usuario_id: solicitanteId,
            solicitud_id: solicitudId,
            tipo: 'firma_digital_solicitante',
            titulo: 'Solicitud de Firma Digital - Contrato de Crédito',
            mensaje: 'Se ha enviado una solicitud de firma digital para tu contrato de crédito aprobado. Por favor, revisa y firma el documento',
            datos_adicionales: {
                url_firma: firma.url_firma_solicitante,
                tipo_firma: 'digital',
                expira_en: firma.fecha_expiracion,
                firma_id: firma.id
            },
            leida: false,
            created_at: new Date().toISOString()
        },
        {
            usuario_id: operadorId,
            solicitud_id: solicitanteId,
            tipo: 'firma_digital_operador',
            titulo: 'Proceso de Firma Digital Iniciado',
            mensaje: 'Se ha iniciado el proceso de firma digital para el contrato. El solicitante debe firmar primero',
            datos_adicionales: {
                url_firma: firma.url_firma_operador,
                tipo_firma: 'digital',
                expira_en: firma.fecha_expiracion,
                firma_id: firma.id
            },
            leida: false,
            created_at: new Date().toISOString()
        }
    ];
    const { data, error}= await this.supabaseAdmin
        .from('notificaciones')
        .insert(notificaciones)
        .select();
    if(error) throw error;
    return data.map(n => new Notificacion(n));

    }
    async crearParaComentario(solicitud, comentario, usuarioOrigen){
        let usuarioDestino = null;
        let titulo = '';
        let mensaje = '';
        if(comentario.tipo === 'operador_a_solicitante'){
            usuarioDestino = solicitud.solicitante_id;
            titulo = 'Nuevo comentario del operador';
            mensaje = `El operador ha enviado un comentario sobre tu solicitud: "${comentario.comentario.substring(0,100)}..."`;

        } else if (comentario.tipo === 'solicitante_a_operador'){
            usuarioDestino = solicitud.operador_id;
            titulo = 'Nuevo comentario del solicitante';
            mensaje = `El solicitante ha respondido a tu comentario: "${comentario.comentario.substring(0,100)}..."`;
        }
        if(usuarioDestino){
            const notificacionData = {
                usuario_id: usuarioDestino,
                solicitud_id: solicitud.id,
                tipo: 'nuevo_comentario',
                titulo: titulo,
                mensaje: mensaje,
                leida: false,
                datos_adicionales:{
                    comentario_id: comentario.id,
                    tipo_comentario: comentario.tipo,
                    usuario_origen: usuarioOrigen.nombre_completo,
                    comentario_preview: comentario.comentario.substring(0,100)
                },
                created_at: new Date().toISOString() 
            };
            return await this.crear(notificacionData);
        }
        return null;
    }
    async notificarAprobacionSolicitud(solicitudId, solicitanteId, operadorId){
        const notificaciones = [
            {
                usuario_id: solicitanteId,
                solicitud_id: solicitudId,
                tipo: 'solicitud_aprobada',
                titulo: 'Solicitud aprobada!',
                mensaje: 'Tu solicitud de crédito ha sido aprobada. El proceso de firma digital se iniciará automáticamente.',
                datos_adicionales: { tipo: 'aprobacion', siguiente_paso: 'firma_digital'},
                leida: false,
                created_at: new Date().toISOString()
            },
            {
                usuario_id: operadorId,
                solicitud_id: solicitudId,
                tipo: 'solicitud_aprobada_operador',
                titulo: 'Solicitud aprobada - proceso iniciado',
                mensaje: 'Has aprobado la solicitud. El proceso de irma digital se iniciará automáticamente.',
                datos_adicionales: { tipo: 'confirmacion_aprobacion'},
                leida: false,
                created_at: new Date().toISOString()
            }
        ];
        const { data, error} = await this.supabaseAdmin
            .from('notificaciones')
            .insert(notificaciones)
            .select();
        if(error) throw error;
        return data.map(n=>new Notificacion(n));
    }   
    async notificarErrorFirmaDigital(operadorId, solicitudId, errorMessage){
        const notificacionData = {
            usuario_id: operadorId,
            solicitud_id: solicitudId,
            tipo: 'error_firma_digital_automatica',
            titulo: 'Error en firma digital automática',
            mensaje: `No se pudo iniciar automáticamente el proceso de firma digital para la solicitud ${solicitudId}: ${errorMessage}`,
            datos_adicionales: {
                tipo: 'error',
                error: errorMessage,
                requiere_accion: true
            },
            leida: false,
            created_at: new Date().toISOString()
        };
        return await this.crear(notificacionData);
    }
    async notificarCambioEstado(solicitudId, usuarioId, estadoAnterior, estadoNuevo, comentarios =''){
        const mensajes = {
            'en_revision': 'Tu solicitud está en revisión por un operador.',
            'pendiente_info': 'Se requiere información adicional para procesar tu solicitud.',
            'aprobado': '¡Felicidades! Tu solicitud ha sido aprobada.',
            'rechazado': 'Tu solicitud ha sido rechazada.',
            'firmado': 'El contrato ha sido firmado exitosamente.',
            'desembolsado': 'El crédito ha sido desembolsado.'
        };
        const titulo = `Estado actualizado: ${estadoNuevo}`;
        const mensajeBase = mensajes[estadoNuevo] || `El estado de tu solicitud cambió a: ${estadoNuevo}`;
        const mensajeFinal = comentarios ? `${mensajeBase}\nComentarios: ${comentarios}`: mensajeBase;
        const notificacionData = {
            usuario_id: usuarioId,
            solicitud_id: solicitudId,
            tipo: `cambio_estado_${estadoNuevo}`,
            titulo: titulo,
            mensaje: mensajeFinal,
            datos_adicionales: {
                estado_anterior: estadoAnterior,
                estado_nuevo: estadoNuevo,
                comentarios: comentarios
            },
            leida: false,
            created_at: new Date().toISOString()
        };
        return await this.crear(notificacionData);


    }
    async notificarVencimientoPlazo(usuarioId, solicitudId, tituloPlazo, diasRestantes=0){
        const mensaje = diasRestantes >0 ? `Tienes ${diasRestantes} día(s) restante(s) para completar este proceso.` : 'El plazo para completar este proceso ha vencido.';
        const notificacionData = {
            usuario_id: usuarioId,
            solicitud_id: solicitudId,
            tipo: `vencimiento_${tipoPlazo}`,
            titulo: `Plazo ${diasRestantes >0 ? 'por Vencer': 'Vencido'}`,
            mensaje: mensaje,
            datos_adicionales: {
                tipo_plazo: tipoPlazo,
                dias_restantes: diasRestantes,
                urgente: diasRestantes <=2
            },
            leida: false,
            created: new Date().toISOString
        };
        return await this.crear(notificacionData);
    }
}
module.exports = SupabaseNotificacionRepository;
