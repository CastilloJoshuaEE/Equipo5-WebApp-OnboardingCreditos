// backend/application/use-cases/contratos/GenerarContratoParaSolicitud.js
const Contrato = require('../../../domain/entities/Contrato');
const ContratoController = require('../../../interfaces/controllers/ContratoController');
class GenerarContratoParaSolicitud{
    constructor(contratoRepository, wordService, supabaseAdmin){
        this.contratoRepository = contratoRepository;
        this.wordService = wordService;
        this.supabaseAdmin = supabaseAdmin;
    }
    async execute(solicitudId){
        // Obtener solicitud
        const { data: solicitud, error} = await this.supabaseAdmin
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
    } catch(error){
        contratoExistente = null;
    }
    
    if(contratoExistente){
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
        const rutaStorage = await this.generarWordContrato(contratoActualizado.id, solicitud);
        
        // Actualizar la ruta del documento
        contratoActualizado.ruta_documento = rutaStorage;
        
        return contratoActualizado; // ← DEVOLVER el objeto actualizado
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
    if(erroresValidacion.length > 0){
        throw new Error(`Datos de contrato inválidos: ${erroresValidacion.join(', ')}`);
    }
    
    // Crear contrato
    const contrato = await this.contratoRepository.crear(contratoEntity.toJSON());
    
    // Generar word del contrato
    const rutaStorage = await this.generarWordContrato(contrato.id, solicitud);
    
    // Actualizar el objeto contrato con la ruta
    contrato.ruta_documento = rutaStorage;
    
    return contrato; // ← DEVOLVER el objeto completo
}
    generarNumeroContrato(numeroSolicitud){
        return `CONTR-${numeroSolicitud}-${Date.now()}`;
    }
async generarWordContrato(contratoId, solicitud){
    const pdfBuffer = await ContratoController.crearDOCXContrato(solicitud);
    const nombreArchivo = `contrato-${contratoId}.docx`;
    const rutaStorage = `contratos/${nombreArchivo}`;
    
    // Usar supabaseAdminAdmin para evitar problemas de RLS
    const { error: uploadError } = await this.supabaseAdmin.storage
        .from('kyc-documents')
        .upload(rutaStorage, pdfBuffer, {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            upsert: true,
            cacheControl: '3600'
        });
        
    if (uploadError) {
        console.error('Error subiendo documento:', uploadError);
        throw new Error(`Error subiendo documento: ${uploadError.message}`);
    }
    
    // Verificar que se subió correctamente obteniendo la URL pública
    const { data: urlData } = this.supabaseAdmin.storage
        .from('kyc-documents')
        .getPublicUrl(rutaStorage);
        
    // Actualizar la ruta en la base de datos
    await this.contratoRepository.actualizarRutaDocumento(contratoId, rutaStorage);
    
    return rutaStorage;
}
}
module.exports = GenerarContratoParaSolicitud;