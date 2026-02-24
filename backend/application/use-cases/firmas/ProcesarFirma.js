// backend/application/use-cases/firmas/ProcesarFirma.js
const FirmaDigital = require('../../../domain/entities/FirmaDigital');
class ProcesarFirma{
    constructor(firmaDigitalRepository, wordService, notificacionService){
        this.firmaDigitalRepository = firmaDigitalRepository;
        this.wordService = wordService;
        this.notificacionService = notificacionService;
    }
    async execute(firma_id, {firma_data, tipo_firma}, usuario){
        console.log('Procesando firma word para:', firma_id);
        if(!firma_data || !tipo_firma){
            return {
                success: false,
                status: 400,
                message: 'Datos de firma y tipo son requeridos'
            };
        }
        // Verificar permisos
        const tienePermisos = await this.firmaDigitalRepository.verificarPermisos(
            firma_id,
            usuario.id,
            usuario.rol
        );
        if(!tienePermisos){
            return {
                success: false,
                status: 403,
                message: 'No tiene permisos para firmar este contrato'
            };
        }
        // Obtener información actual de la firma
        const firmaActual = await this.firmaDigitalRepository.obtenerPorId(firma_id);
        if(!firmaActual){
            return { 
                success: false,
                status: 404,
                message: 'Proceso de firma no encontrado'
            };
        }
        // Preparar datos de firma
        const datosFirma ={
            nombreFirmante: usuario.nombre_completo,
            fechaFirma: new Date().toISOString(),
            ubicacion: firma_data.ubicacion || 'Ubicación no disponible',
            firmaTexto: firma_data.firmaTexto,
            firmaImagen: firma_data.tipo_firma,
            hashDocumento: firmaActual.hash_documento_original,
            ipFirmante: usuario.ip,
            userAgent: usuario.userAgent

        };
        // Procesar firma acumulativa
        const firmaResult = await this.wordService.procesarFirmaAcumulativa(
            firma_id,
            datosFirma,
            tipo_firma
        );
        if(!firmaResult.success){
            return {
                success: false,
                status: 500,
                message: 'Error procesando firma:' + firmaResult.error
            };
        }
        // Verificar integridad completa
        const integridadValida = await this.wordService.verificarIntegridadCompleta(firma_id);
        const esIntegridadValida = Boolean(integridadValida);
        // Determinar nuevo estado
        let nuevoEstado;
        if(esIntegridadValida){
            nuevoEstado = FirmaDigital.ESTADOS.FIRMADO_COMPLETO;
        } else if(tipo_firma === 'solicitante'){
            nuevoEstado = FirmaDigital.ESTADOS.FIRMADO_SOLICITANTE;
        } else if (tipo_firma === 'operador'){
            nuevoEstado = FirmaDigital.ESTADOS.FIRMADO_OPERADOR;
        }
        // Actualizar
        const updateData = {
            hash_documento_firmado: firmaResult.hash,
            integridad_valida: esIntegridadValida,
            estado: nuevoEstado,
            fecha_firma_completa: esIntegridadValida ? new Date().toISOString(): null,
            updated_at: new Date().toISOString(),
            url_documento_firmado: firmaResult.ruta
        };
        if (tipo_firma === 'solicitante'){
            updateData.fecha_firma_solicitante = new Date().toISOString();
            updateData.ip_firmante = usuario.ip;
            updateData.user_agent_firmante = usuario.userAgent;
            updateData.ubicacion_firmante = datosFirma.ubicacion;


        } else if (tipo_firma === 'operador'){
            updateData.fecha_firma_operador = new Date().toISOString();
        }
        const firmaActualizada = await this.firmaDigitalRepository.actualizar(firma_id, updateData);
        // Registrar auditoría
        await this.firmaDigitalRepository.registrarAuditoria({
            firma_id: firma_id,
            usuario_id: usuario.id,
            accion: 'firma_documento_acumulativa',
            descripcion: `Documento firmado por ${tipo_firma}.Estado:${nuevoEstado}. Integridad: ${esIntegridadValida? 'COMPLETA': 'PARCIAL'}`,
            estado_anterior: firmaActual.estado,
            estado_nuevo: nuevoEstado,
            ip_address: usuario.ip,
            user_agent: usuario.userAgent,
            created_at: new Date().toISOString()
        });
        // Procesar según el tipo de firma
        if(tipo_firma === 'solicitante'){
            await this.procesarFirmaSolicitante(firma_id, firmaActual);

        } else if (tipo_firma === 'operador'){
            await this.procesarFirmaOperador(firma_id, firmaActual);
        }
        // Si la integridad es completa, notificar a todas las partes
        if( esIntegridadValida){
            await this.marcarFirmaCompleta(firma_id, firmaActual);
        }
        console.log('Firma acumulativa procesada exitosamente:',{
            firma_id,
            tipo_firma,
            integridad_completa: esIntegridadValida,
            nuevo_estado: nuevoEstado
        });
        return {
            success: true,
            message: esIntegridadValida ? 'CONTRATO COMPLETAMENTE FIRMADO - Integridad válida': 'Firma procesada exitosamente',
            data: {
                firma_id: firma_id,
                estado: nuevoEstado,
                integridad_valida: esIntegridadValida,
                url_descarga: firmaResult.ruta,
                hash_firmado: firmaResult.hash,
                es_firma_completa: esIntegridadValida,
                firmas_presentes: {
                    solicitante: tipo_firma === 'solicitante' || !!firmaActual.fecha_firma_solicitante,
                    operador: tipo_firma === 'operador' || !!firmaActual.fecha_firma_operador
                }
            }
        };
    }
    async procesarFirmaSolicitante(firmaId, firma){
        try{
            console.log('Procesando firma del solicitante:', firmaId);
            await this.notificacionService.notificarFirmaSolicitanteCompletada(firma.contrato_id);
        }catch(error){
            console.error('Error procesando firma del solicitante:', error);
        }
    }
    async procesarFirmaOperador(firmaId, firma){
        try{
            console.log('Procesando firma del operador:', firmaId);
            const firmaActual = await this.firmaDigitalRepository.obtenerPorId(firmaId);
            if(firmaActual.fecha_firma_solicitante && firmaActual.fecha_firma_operador){
                await this.marcarFirmaCompleta(firmaId, firma);
            } else {
                await this.notificacionService.notificacionFirmaOperadorCompletada(firma.contrato_id);
            }
        } catch (error){
            console.error('Error procesando firma del operador:', error);
        }
    }
    async marcarFirmaCompleta(firmaId, firma){
        try{
            console.log('Marcando firma como completa:', firmaId);
            await this.firmaDigitalRepository.actualizar(firmaId,{
                estado: 'firmado_completo',
                fecha_firma_completa: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            await this.notificacionService.notificarFirmaCompletada(firma.contrato_id, firma.solicitud_id);
            console.log('Contrato completamente firmado:', firma.contrato_id);
        } catch (error){
            console.log('Error marcando firma como completa:', error);
        }
    }

}
module.exports = ProcesarFirma;
