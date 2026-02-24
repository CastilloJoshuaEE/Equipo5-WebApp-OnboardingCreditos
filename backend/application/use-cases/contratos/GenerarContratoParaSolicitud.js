// backend/application/use-cases/contratos/GenerarContratoParaSolicitud.js
const Contrato = require('../../../domain/entities/Contrato');
const ContratoController = require('../../../interfaces/controllers/ContratoController');
class GenerarContratoParaSolicitud{
    constructor(contratoRepository, wordService, supabase){
        this.contratoRepository = contratoRepository;
        this.wordService = wordService;
        this.supabase = supabase;
    }
    async execute(solicitudId){
        // Obtener solicitud
        const { data: solicitud, error} = await this.supabase
            .from('solicitudes_credito')
            .select(`
                *,
                solicitantes: solicitantes!solicitante_id(
                    usuarios(*),
                    nombre_empresa,
                    cuit,
                    representante_legal,
                    domicilio
                ),
                operadores: operadores!operador_id(
                    usuarios(*)
                )

                `)
            .eq('id', solicitudId)
            .eq('estado', 'aprobado')
            .single();
        if(error || !solicitud){
            throw new Error('Solicitud no encontrada o no aprobada');
        }
        // VERIFICAR SI YA EXISTE UN CONTRATO PARA ESTA SOLICITUD
        let contratoExistente;
        try{
            contratoExistente = await this.contratoRepository.obtenerPorSolicitud(solicitudId);
        } catch( error){
            console.log('No se pudo verificar contrato existente, creando uno nuevo...');
            contratoExistente = null;
        }
        if(contratoExistente){
            console.log('Contrato existente encontrado, actualizando:', contratoExistente.id);
            const numeroContrato = this.generarNumeroContrato(solicitud.numero_solicitud);
            const updateData = {
                numero_contrato: numeroContrato,
                monto_aprobado: solicitud.monto,
                tasa_interes: 24.50,
                plazo_meses: solicitud.plazo_meses,
                estado: 'generado',
                updated_at: new Date().toISOString()
            };
            const contratoActualizado = await this.contratoRepository.actualizar(contratoExistente.id, updateData);
            // Generar word del contrato actualizado
            await this.generarWordContrato(contratoActualizado.id, solicitud);
            console.log('Contrato existente actualizado para solicitud:', solicitudId);
            return contratoActualizado;

        }
        // Si no existe, crear uno nuevo
        const numeroContrato = this.generarNumeroContrato(solicitud.numero_solicitud);
        const contratoEntity = new Contrato({
            solicitud_id: solicitudId,
            numero_contrato: numeroContrato,
            monto_aprobado: solicitud.monto,
            tasa_interes: 24.50,
            plazo_meses: solicitud.plazo_meses,
            estado: 'generado',
            tipo: 'credito_standard'
        });
        // Validar datos
        const erroresValidacion = contratoEntity.validarDatos();
        if(erroresValidacion.length >0){
            throw new Error(`Datos de contrato inválidos: ${erroresValidacion.join(', ')}`);

        }
        // Crear contrato
        const contrato = await this.contratoRepository.crear(contratoEntity.toJSON());
        // Generar word del contrato
        await this.generarWordContrato(contrato.id, solicitud);
        console.log('Nuevo contrato generado para solicitud:', solicitudId);
        return contrato;


    }
    generarNumeroContrato(numeroSolicitud){
        return `CONTR-${numeroSolicitud}-${Date.now()}`;
    }
    async generarWordContrato(contratoId, solicitud){
        console.log('Generando word para contrato:', contratoId);
        const pdfBuffer = await ContratoController.crearDOCXContrato(solicitud);
        const nombreArchivo = `contrato-${contratoId}.docx`;
        const rutaStorage = `contratos/${nombreArchivo}`;
        await this.wordService.subirDocumento(nombreArchivo, pdfBuffer,{
            contrato_id: contratoId,
            solicitud_id: solicitud.id,
            numero_solicitud: solicitud.numero_solicitud
        });
        await this.contratoRepository.actualizarRutaDocumento(contratoId, rutaStorage);
        console.log('word de contrato generado y guardado:', rutaStorage);
        return rutaStorage;
    }
}
module.exports = GenerarContratoParaSolicitud;