// backend/application/use-cases/notificaciones/ObtenerContadorNoLeidas.js
class ObtenerContadorNoLeidas{
    constructor(notificacionRepository){
        this.notificacionRepository = notificacionRepository;
    }
    async execute(usuarioId){
        const count = await this.notificacionRepository.obtenerContador(usuarioId, false);
        return {
            success: true,
            data: {count}
        };
    }
}
module.exports = ObtenerContadorNoLeidas;
