// backend/application/use-cases/contratos/VerificarEstadoContrato.js
class VerificarEstadoContrato{
    constructor(contratoRepository){
        this.contratoRepository = contratoRepository;
    }
    async execute(firma_id){
        console.log('Verificando estado del contrato para firma:', firma_id);
        const firma = await this.contratoRepository.verificarEstadoParaFirma(firma_id);
        if(!firma){
            return{
                success: false,
                status: 404,
                message: 'Proceso de firma no encontrado'
            };
        }
        return {
            success: true,
            data: {
                firma_id: firma.id,
                estado_firma: firma.estado,
                contrato_valido: !!firma.contratos?.ruta_documento,
                ruta_documento: firma.contratos?.ruta_documento,
                estado_contrato: firma.contratos?.estado
            }

        };
    }
}
module.exports = VerificarEstadoContrato;
