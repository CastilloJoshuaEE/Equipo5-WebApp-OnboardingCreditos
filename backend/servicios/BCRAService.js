const axios = require('axios');
const https = require('https');

class BCRAService {
    constructor() {
        this.baseURL = 'https://api.bcra.gob.ar';
        this.timeout = 30000; // Aumentar timeout
        
        // Configurar agente HTTPS para desarrollo
        this.httpsAgent = new https.Agent({
            rejectUnauthorized: process.env.NODE_ENV === 'production',
            keepAlive: true,
            maxSockets: 50,
            timeout: 30000
        });
    }

    async consultarDeudas(cuit) {
        try {
            console.log(`. Consultando BCRA para CUIT: ${cuit}`);
            
            // Validar CUIT (11 dígitos)
            const cuitLimpio = cuit.replace(/\D/g, '');
            if (cuitLimpio.length !== 11) {
                throw new Error('CUIT debe tener 11 dígitos');
            }

            const url = `${this.baseURL}/CentralDeDeudores/v1.0/Deudas/${cuitLimpio}`;
            
            console.log(`. URL de consulta: ${url}`);
            
            const response = await axios.get(url, {
                timeout: this.timeout,
                httpsAgent: this.httpsAgent,
                headers: {
                    'User-Agent': 'SistemaCreditosPYME/1.0',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                ...(process.env.NODE_ENV !== 'production' && {
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false // Solo en desarrollo
                    })
                })
            });

            console.log('. Respuesta BCRA recibida correctamente');
            
            return {
                success: true,
                data: response.data,
                consulta: new Date().toISOString(),
                procesado: this.procesarRespuestaBCRA(response.data)
            };
        } catch (error) {
            console.error('. Error consultando BCRA:', error.message);
            
            // Manejar diferentes tipos de error
            if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || 
                error.code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
                error.message.includes('unable to verify the first certificate')) {
                
                console.log('. Reintentando consulta sin verificación SSL...');
                return await this.consultarDeudasSinSSL(cuit);
            }
            
            if (error.response) {
                const status = error.response.status;
                console.error(`. Status code: ${status}`);
                
                if (status === 404) {
                    return {
                        success: true,
                        data: null,
                        message: 'No se encontraron registros en BCRA para el CUIT proporcionado',
                        consulta: new Date().toISOString()
                    };
                } else if (status === 400) {
                    return {
                        success: false,
                        error: 'Parámetro erróneo: CUIT inválido',
                        data: null
                    };
                } else if (status === 500) {
                    return {
                        success: false,
                        error: 'Error interno del servidor BCRA',
                        data: null
                    };
                }
            }
            
            return {
                success: false,
                error: error.message,
                data: null,
                code: error.code
            };
        }
    }

    // Método alternativo sin verificación SSL para desarrollo
    async consultarDeudasSinSSL(cuit) {
        try {
            const cuitLimpio = cuit.replace(/\D/g, '');
            const url = `${this.baseURL}/CentralDeDeudores/v1.0/Deudas/${cuitLimpio}`;
            
            console.log('. Consultando sin verificación SSL...');
            
            const response = await axios.get(url, {
                timeout: this.timeout,
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                }),
                headers: {
                    'User-Agent': 'SistemaCreditosPYME/1.0',
                    'Accept': 'application/json'
                }
            });

            console.log('. Consulta sin SSL exitosa');
            
            return {
                success: true,
                data: response.data,
                consulta: new Date().toISOString(),
                procesado: this.procesarRespuestaBCRA(response.data),
                sinSSL: true // Indicar que se usó método sin SSL
            };
        } catch (error) {
            console.error('. Error en consulta sin SSL:', error.message);
            return {
                success: false,
                error: `Error incluso sin SSL: ${error.message}`,
                data: null
            };
        }
    }

    // Procesar respuesta de BCRA - MEJORADO
    procesarRespuestaBCRA(data) {
        try {
            console.log('. Procesando respuesta BCRA...');
            
            if (!data || !data.results) {
                return {
                    encontrado: false,
                    mensaje: 'Estructura de respuesta BCRA inválida'
                };
            }

            const { results } = data;
            
            if (!results.periodos || results.periodos.length === 0) {
                return {
                    encontrado: false,
                    mensaje: 'No se encontraron registros en BCRA',
                    denominacion: results.denominacion || 'No disponible',
                    identificacion: results.identificacion || 'No disponible'
                };
            }

            const ultimoPeriodo = results.periodos[0];
            const entidades = ultimoPeriodo.entidades || [];

            console.log(`. Encontradas ${entidades.length} entidades en BCRA`);

            // Calcular resumen de deudas
            const resumen = {
                denominacion: results.denominacion || 'No disponible',
                identificacion: results.identificacion || 'No disponible',
                totalDeudas: entidades.length,
                montoTotal: entidades.reduce((sum, ent) => sum + (parseFloat(ent.monto) || 0), 0),
                situacionPromedio: this.calcularSituacionPromedio(entidades),
                periodo: ultimoPeriodo.periodo,
                entidades: entidades.map(ent => ({
                    nombre: ent.entidad,
                    situacion: ent.situacion,
                    situacionDesc: this.obtenerDescripcionSituacion(ent.situacion),
                    monto: parseFloat(ent.monto) || 0,
                    diasAtraso: ent.diasAtraso || 0,
                    fechaSit1: ent.fechaSit1,
                    refinanciaciones: ent.refinanciaciones || false,
                    recategorizacionOblig: ent.recategorizacionOblig || false,
                    situacionJuridica: ent.situacionJuridica || false,
                    irrecDisposicionTecnica: ent.irrecDisposicionTecnica || false,
                    enRevision: ent.enRevision || false,
                    procesoJud: ent.procesoJud || false
                }))
            };

            console.log('. Procesamiento BCRA completado');
            
            return {
                encontrado: true,
                ...resumen
            };

        } catch (error) {
            console.error('. Error procesando respuesta BCRA:', error);
            return {
                error: true,
                mensaje: 'Error procesando información de BCRA',
                detalle: error.message
            };
        }
    }

    // Calcular situación promedio
    calcularSituacionPromedio(entidades) {
        if (entidades.length === 0) return 1;
        
        const situacionesValidas = entidades
            .filter(ent => ent.situacion && ent.situacion >= 1 && ent.situacion <= 5)
            .map(ent => ent.situacion);
            
        if (situacionesValidas.length === 0) return 1;
        
        const suma = situacionesValidas.reduce((sum, situacion) => sum + situacion, 0);
        return Math.round(suma / situacionesValidas.length);
    }

    // Obtener descripción de situación - MEJORADO según documentación BCRA
    obtenerDescripcionSituacion(situacion) {
        const situaciones = {
            1: 'Normal - Situación crediticia normal',
            2: 'Seguimiento especial / Riesgo bajo - Requiere atención especial',
            3: 'Con problemas / Riesgo medio - Presenta dificultades',
            4: 'Alto riesgo / Riesgo alto - Alto riesgo de insolvencia', 
            5: 'Irrecuperable - Crédito considerado incobrable'
        };
        return situaciones[situacion] || `Situación desconocida (${situacion})`;
    }

    // Consultar histórico
    async consultarHistorico(cuit) {
        try {
            const cuitLimpio = cuit.replace(/\D/g, '');
            const url = `${this.baseURL}/CentralDeDeudores/v1.0/Deudas/Historicas/${cuitLimpio}`;
            
            const response = await axios.get(url, { 
                timeout: this.timeout,
                httpsAgent: this.httpsAgent
            });
            
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error consultando histórico BCRA:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Consultar cheques rechazados
    async consultarChequesRechazados(cuit) {
        try {
            const cuitLimpio = cuit.replace(/\D/g, '');
            const url = `${this.baseURL}/CentralDeDeudores/v1.0/Deudas/ChequesRechazados/${cuitLimpio}`;
            
            const response = await axios.get(url, { 
                timeout: this.timeout,
                httpsAgent: this.httpsAgent
            });
            
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error consultando cheques rechazados BCRA:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new BCRAService();