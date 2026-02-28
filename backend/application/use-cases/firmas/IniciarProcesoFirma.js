// backend/application/use-cases/firmas/IniciarProcesoFirma.js
const FirmaDigital = require('../../../domain/entities/FirmaDigital');
const GenerarContratoParaSolicitud = require('../contratos/GenerarContratoParaSolicitud');
const crypto = require('crypto');

class IniciarProcesoFirma{
    constructor(
        firmaDigitalRepository,
        contratoRepository,
        wordService,
        notificacionService,
        supabaseAdmin
    ){
        this.firmaDigitalRepository = firmaDigitalRepository;
        this.contratoRepository = contratoRepository;
        this.wordService = wordService;
        this.notificacionService = notificacionService;
        this.supabaseAdmin = supabaseAdmin;
    }
    async execute(solicitud_id, usuario, {forzar_reinicio}){
        console.log('Iniciando proceso de firma para solicitud:', solicitud_id);
        // 1. Verificar que la solicitud existe y está aprobada
        const { data: solicitud, error: solError} = await this.supabaseAdmin
            .from('solicitudes_credito')
            .select(`
                *,
                solicitantes:solicitantes!solicitante_id(
                    usuarios(*),
                    nombre_empresa,
                    cuit,
                    representante_legal,
                    domicilio
                ),
                operadores:operadores!operador_id(
                    usuarios(*)
                )
                `)
            .eq('id', solicitud_id)
            .eq('estado', 'aprobado')
            .single();
        if(solError || !solicitud){
            return {
                success: false,
                status: 404,
                message: 'Solicitud no encontrada o no aprobada'
            };
        }
        // 2. Verificar y actualizar contrato existente
        let contratoFinal;
        let contratoExistente;
        try{
            contratoExistente = await this.contratoRepository.obtenerPorSolicitud(solicitud_id);

        }catch(error){
            console.log('Error verificando contrato existente, asumiendo que no existe:', error.message);
            contratoExistente =null;
        }
        if(!contratoExistente){
    console.log('No existe contrato, generando uno nuevo...');
    try{
        const generarContratoUseCase = new GenerarContratoParaSolicitud(
            this.contratoRepository,
            this.wordService,
            this.supabaseAdmin
        );
        
        // EJECUTAR y GUARDAR el resultado directamente
        const contratoGenerado = await generarContratoUseCase.execute(solicitud_id);
        
        if(!contratoGenerado){
            throw new Error('No se pudo obtener el contrato generado');
        }
        
        // USAR el contrato devuelto por execute() en lugar de hacer otra consulta
        contratoFinal = contratoGenerado;
        console.log('Contrato generado exitosamente:', contratoFinal.id);
        
    } catch (error){
        console.error('Error generando contrato:', error);
        return {
            success: false,
            status: 400,
            message: 'Error generando contrato:' + error.message
        };
    }
}
 else {
    console.log('Contrato existente encontrado, actualizando:', contratoExistente.id);
    try {
        // Usar el repositorio directamente en lugar de supabaseAdmin
        const contratoActualizado = await this.contratoRepository.actualizar(contratoExistente.id, {
            estado: 'generado',
            monto_aprobado: solicitud.monto,
            plazo_meses: solicitud.plazo_meses,
            numero_contrato: `CONTR-${solicitud.numero_solicitud}-${Date.now()}`
        });
        
        contratoFinal = contratoActualizado;
        console.log('Contrato existente actualizado:', contratoFinal.id);
        
    } catch(error) {
        console.error('Error actualizando contrato existente:', error);
        return {
            success: false,
            status: 400,
            message: 'Error actualizando contrato existente:' + error.message
        };
    }
}
        // 3. Verificar que el contrato tiene documento
        if(!contratoFinal.ruta_documento){
            console.log('Contrato sin documento, generando word');
            try{
                const generarContratoUseCase = new GenerarContratoParaSolicitud(
                    this.contratoRepository,
                    this.wordService,
                    this.supabaseAdmin
                );
                await generarContratoUseCase.generarWordContrato(contratoFinal.id, solicitud);
                const { data:contratoActualizado} = await this.supabaseAdmin
                    .from('contratos')
                    .select('*')
                    .eq('id', contratoFinal.id)
                    .single();
                if(!contratoActualizado?.ruta_documento){
                    throw new Error('No se pudo generar el documento Word');
                }
                contratoFinal = contratoActualizado;
            } catch(error){
                console.error('Error generando word:', error);
                return {
                    success: false,
                    status: 400,
                    message: 'Error generando documento del contrato:' + error.message
                };
                
            }
            
        }
        // 4. Verificar que el documento existe en storage
console.log('Verificando documento en storage:', contratoFinal.ruta_documento);

let fileData;
const { data: downloadData, error: fileError } = await this.supabaseAdmin.storage
    .from('kyc-documents')
    .download(contratoFinal.ruta_documento);

if (fileError) {
    console.error('Documento no encontrado en storage:', fileError);
    try {
        console.log('Regenerando documento...');
        const generarContratoUseCase = new GenerarContratoParaSolicitud(
            this.contratoRepository,
            this.wordService,
            this.supabaseAdmin
        );
        
        // Regenerar el word (esto actualiza la ruta en la BD)
        await generarContratoUseCase.generarWordContrato(contratoFinal.id, solicitud);
        
        // AHORA SÍ, descargar el documento recién generado
        const { data: newFileData, error: newFileError } = await this.supabaseAdmin.storage
            .from('kyc-documents')
            .download(contratoFinal.ruta_documento);
            
        if (newFileError) {
            throw new Error('No se pudo regenerar el documento: ' + newFileError.message);
        }
        
        // Asignar el nuevo fileData
        fileData = newFileData;
        console.log('Documento regenerado exitosamente');
        
    } catch (regenerateError) {
        console.error('Error regenerando documento:', regenerateError);
        return {
            success: false,
            status: 400,
            message: 'El documento del contrato no está disponible: ' + regenerateError.message
        };
    }
} else {
    // Si no hay error, asignar el fileData descargado
    fileData = downloadData;
}

console.log('Documento verificado exitosamente');

// 5. Verificar si ya existe proceso de firma
const firmaExistente = await this.firmaDigitalRepository.verificarFirmaActiva(solicitud_id);
if(firmaExistente){
    console.log('Ya existe proceso de firma:', firmaExistente);
    console.log('Reemplazando firma existente con nueva firma...');
    await this.firmaDigitalRepository.actualizar(firmaExistente.id,{
        estado:'reemplazado',
        updated_at: new Date().toISOString()
    });
    console.log('Firma anterior marcada como reemplazada:', firmaExistente.id);
}

        // 6. Procesar el documento para firma
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const metadatosDocumento= {
            solicitud_id: solicitud_id,
            contrato_id: contratoFinal.id,
            numero_solicitud: solicitud.numero_solicitud,
            fecha_generacion: contratoFinal.created_at,
            tamanio: buffer.length,
            paginas: await this.obtenerNumeroPaginasWord(buffer)
        };
        const hashOriginal = this.generarHashDocumento(buffer, metadatosDocumento);
        const uploadResult = await this.wordService.subirDocumento(
            `contrato-${solicitud.numero_solicitud}-${Date.now()}.docx`,
            buffer,
            metadatosDocumento

        );
        if(!uploadResult.success){
            throw new Error('Error subiendo documento:'+uploadResult.error);
        }
        // 7. Crear solicitu de firma múltiple
        const solicitante = solicitud.solicitantes?.usuarios;
        const operador = solicitud.operadores?.usuarios || usuario;
        const firmaResult = await this.crearSolicitudFirmaMultiple(
            contratoFinal.id,
            solicitante,
            operador
        );
        if(!firmaResult.success){
            console.log('Fallback a firma individual para solicitante');
            const firmaIndividualResult = await this.crearSolicitudFirmaIndividual(
                contratoFinal.id,
                solicitante,
                'solicitante'
            );
            if(!firmaIndividualResult.success){
                throw new Error('Error creando solicitud de firma:'+firmaIndividualResult.error);
            }
            firmaResult.signatureRequestId = firmaIndividualResult.signatureRequestId;
            firmaResult.urlsFirma = {solicitante: firmaIndividualResult.urlFirma};
        }
        // 8. Registrar en base de datos
        const firmaEntity = new FirmaDigital({
            contrato_id: contratoFinal.id,
            solicitud_id: solicitud_id,
            signature_request_id: firmaResult.signatureRequestId,
            ruta_documento: uploadResult.ruta,
            hash_documento_original: hashOriginal,
            estado: 'enviado',
            url_firma_solicitante: firmaResult.urlsFirma?.solicitante,
            url_firma_operador: firmaResult.urlsFirma?.operador,
            fecha_envio: new Date().toISOString(),
            fecha_expiracion: new Date(Date.now()+7*24*60*60*1000).toISOString(),
            intentos_envio: 1
        });
        const firma = await this.firmaDigitalRepository.crear(firmaEntity.toJSON());
        // 9. Actualizar contrato
        await this.supabaseAdmin
            .from('contratos')
            .update({
                estado: 'pendiente_firma',
                firma_digital_id: firma.id,
                hash_contrato: hashOriginal,
                updated_at: new Date().toISOString()
            })
            .eq('id', contratoFinal.id);
        // 10. Registrar auditoría
        await this.firmaDigitalRepository.registrarAuditoria({
            firma_id: firma.id,
            usuario_id: usuario.id,
            accion: 'iniciar_proceso_firma',
            descripcion: 'Proceso de firma digital iniciado con verificaciones .s',
            estado_anterior: 'pendiente',
            estado_nuevo:'enviado',
            ip_address: usuario.ip,
            user_agent: usuario.userAgent,
            created_at: new Date().toISOString()
        });
        // 11. Crear notificaciones
        await this.notificacionService.crearNotificacionFirma(
            solicitante.id,
            operador.id,
            solicitud_id,
            firma
        );
        console.log('Proceso de firma digital iniciado exitosamente:', firma.id);
        return {
            success: true,
            message: 'Proceso de firma digital iniciado exitosamente',
            data: {
                firma,
                urls_firma: firmaResult.urlsFirma,
                fecha_expiracion: firmaEntity.fecha_expiracion,
                contrato_actualizado: contratoFinal.id,
                firma_anterior_reemplazada: firmaExistente?.id || null
            }
        };
    }
    generarHashDocumento(buffer, metadatos= {}){
        const contenido = buffer.toString('base64') + JSON.stringify(metadatos);
        return crypto.createHash('sha256').update(contenido).digest('hex');
    }
    async obtenerNumeroPaginasWord(buffer){
        try{
            const texto = buffer.toString('utf8');
            const palabras= texto.split(/\s+/).length;
            const paginasEstimadas = Math.max(1, Math.ceil(palabras/1800));
            return paginasEstimadas;
        } catch(error){
            console.error('Error obteniendo número de páginas word:', error);
            return 1;

        }
    }
  async crearSolicitudFirmaMultiple(contratoId, solicitante, operador) {
    try {
      console.log('. Creando solicitud de firma múltiple INTERNA para documento ID:', contratoId);

      const crypto = require('crypto');
      const signatureRequestId = crypto.randomUUID();

      const urlFirmaSolicitante = `/firmar-contrato/${signatureRequestId}?tipo=solicitante`;
      const urlFirmaOperador = `/firmar-contrato/${signatureRequestId}?tipo=operador`;

      console.log('. Solicitud de firma múltiple interna creada:', {
        signatureRequestId,
        contratoId
      });

      return {
        success: true,
        signatureRequestId: signatureRequestId,
        urlsFirma: {
          solicitante: urlFirmaSolicitante,
          operador: urlFirmaOperador
        },
        data: {
          tipo: 'firma_multiple_interna',
          urls: {
            solicitante: urlFirmaSolicitante,
            operador: urlFirmaOperador
          },
          expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      };
    } catch (error) {
      console.error('. Error creando solicitud de firma múltiple interna:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

    async crearSolicitudFirmaIndividual(contratoId, destinatario, tipoFirmante='solicitante'){
        try{
            console.log('Creando solicitud de firma individual interna:', {contratoId, tipoFirmante});
            const signatureRequestId = crypto.randomUUID();
            const urlFirma = `/firmar-contrato/${signatureRequestId}?tipo=${tipoFirmante}`;
            console.log('Solicitud de firma individual interna creada:',{
                signatureRequestId,
                contratoId
            });
            return {
                success: true,
                signatureRequestId: signatureRequestId,
                urlFirma: urlFirma,
                data: {
                    tipo: 'firma_individual_interna',
                    url:urlFirma,
                    expiracion: new Date(Date.now()+7*24*60*60*100)
                }

            };
        }
        catch(error){
            console.error('Error creando solicitud de firma individual interna:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
module.exports = IniciarProcesoFirma;
