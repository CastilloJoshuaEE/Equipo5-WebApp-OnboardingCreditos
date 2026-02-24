// backend/application/use-cases/notificaciones/ObtenerNotificaciones.js
class ObtenerNotificaciones{
    constructor(notificacionRepository){
        this.notificacionRepository = notificacionRepository;
    }
    async execute(usuarioId, {limit=10, offset=0, leida}){
        const filtros ={
            limit: parseInt(limit),
            offset: parseInt(offset),
            leida: leida === 'true' ? true: leida === 'false'?false:undefined

        };
        const notificaciones = await this.notificacionRepository.obtenerPorUsuario(usuarioId, filtros);
        const total = await this.notificacionRepository.obtenerContador(usuarioId);
        const noLeidas = await this.notificacionRepository.obtenerContador(usuarioId, false);
        return {
            success: true,
            data: notificaciones,
            total,
            noLeidas
        };
    }
}
module.exports = ObtenerNotificaciones;
