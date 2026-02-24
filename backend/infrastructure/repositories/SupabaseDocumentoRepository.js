// backend/infrastructure/repositories/SupabaseDocumentoRepository.js
const DocumentoRepository = require('../../domain/repositories/DocumentoRepository');
const Documento = require('../../domain/entities/Documento');
class SupabaseDocumentoRepository extends DocumentoRepository{
    constructor(supabase, supabaseAdmin){
        super();
        this.supabase = supabase;
        this.supabaseAdmin = supabaseAdmin;
    }
    async crear(documentoData){
        const {data, error} = await this.supabase
            .from('documentos')
            .insert([documentoData])
            .select()
            .single();
        if(error) throw new Error(`Error creando documento: ${error.message}`);
        return new Documento(data);
    }
    async actualizar(id, updates){
        const {data, error} = await this.supabase
            .from('documentos')
            .update({
                ...updates,
                update_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        if(error) throw new Error(`Error actualizando documento: ${error.message}`);
        return new Documento(data);
    }
    async eliminar(id){
        const{error} = await this.supabase
            .from('documentos')
            .delete()
            .eq('id', id);
        if(error) throw new Error(`Error eliminando documento: ${error.message}`);
        return { success: true};
    }

    async obtenerPorId(id){
        const { data, error} = await this.supabase
            .from('documentos')
            .select('*')
            .eq('id', id)
            .single();
        if(error) return null;
        return new Documento (data);
    }
    async obtenerPorSolicitud(solicitudId){
        const { data, error}=await this.supabase
            .from('documentos')
            .select ('*')
            .eq('solicitud_id', solicitudId)
            .order('created_at', {ascending: false});
        if(error) throw new Error(`Error obteniendo documentos: ${error.message}`);
        return data.map(d=> new Documento(d));
    }
    async obtenerPorTipoYSolicitud(solicitudId, tipo){
        const { data, error} = await this.supabase
            .from('documentos')
            .select('*')
            .eq('solicitud_id', solicitudId)
            .eq('tipo', tipo)
            .order('created_at', {ascending: false});
        if(error) throw new Error(`Error obteniendo documentos por tipo: ${error.message}`);
        return data.map(d=>new Documento(d));


    }
    async obtenerPorEstado(solicitudId, estado){
        const {data, error} = await this.supabase
            .from('documentos')
            .select('*')
            .eq('solicitud_id', solicitudId)
            .eq('estado', estado)
            .order('created_at', {ascending:false});
        if(error) throw new Error(`Error obteniendo documentos por estado: ${error.message}`);
        return data.map(d=>new Documento(d));

    }
    async contarPorTipoYEstado(solicitudId, tipo, estado){
        const { count, error} = await this.supabase
            .from('documentos')
            .select('*', {count:'exact', head: true})
            .eq('solicitud_id', solicitudId)
            .eq('tipo', tipo)
            .eq('estado', estado);
        if(error) throw new Error(`Error contando documentos: ${error.message}`);
        return count || 0;
    }
    async verificarDocumentosObligatorios(solicitudId){
        const tiposObligatorios= ['dni', 'cuit', 'comprobante_domicilio'];
        const {data:documentos, error} = await this.supabase
            .from('documentos')
            .select('tipo, estado')
            .eq('solicitud_id')
            .in('tipo', tiposObligatorios);
        if(error) throw new Error(`Error verificando documentos:${error.message}`);
        const tiposSubidos = documentos.map(doc =>doc.tipo);
        const documentosFaltantes = tiposObligatorios.filter(tipo => !tiposSubidos.includes(tipo));
        const documentosInvalidados = documentos.filter(doc=>doc.estado !== 'validado');
        const todosValidados = documentosInvalidados.length === 0;
        return {
            completos: documentosFaltantes.length ===0,
            todos_validados: todosValidados,
            documentos_faltantes: documentosFaltantes,
            documentos_subidos: tiposSubidos,
            documentos_invalidados: documentosInvalidados.map (doc =>doc.tipo)

        };


    }
    async obtenerEstadisticas(solicitudId){
        const {data:documentos, error} = await this.supabase
            .from('documentos')
            .select('tipo, estado')
            .eq('solicitud_id', solicitudId);
        if(error) throw new Error(`Error obteniendo estadísticas:${error.message}`);
        const estadisticas = {
            total: documentos?.length || 0,
            por_tipo: {},
            por_estado: {
                pendiente: 0,
                validado: 0,
                rechazado: 0
            }
        };
        if(documentos){
            documentos.forEach(doc =>{
                if(!estadisticas.por_tipo[doc.tipo]){
                    estadisticas.por_tipo[doc.tipo] = 0;
                }
                estadisticas.por_tipo[doc.tipo]++;
                if(estadisticas.por_estado[doc.estado]!== undefined){
                    estadisticas.por_estado[doc.estado]++;
                }
            });
        }
        return estadisticas;
    }
    async obtenerRecientes(limite=10){
        const { data, error} = await this.supabase
            .from('documentos')
            .select(`
                *,
                solicitudes_credito(
                    numero_solicitud,
                    solicitantes: solicitante_id(
                        usuarios(
                            nombre_completo
                        )
                    )
                )
                
                `)
            .order('created_at', {ascending: false})
            .limit(limite);
        if(error) throw new Error(`Error obteniendo documentos recientes:${error.message}`);
        return data.map(d=>new Documento(d));
    }
    async buscar(criterios){
        let query = this.supabase
            .from('documentos')
            .select(`
                *,
                solicitudes_credito(
                    numero_solicitud,
                    solicitantes: solicitante_id(
                        usuarios(
                            nombre_completo,
                            email
                        )
                    )
                )
                `);
        if(criterios.tipo){
            query =query.eq('tipo', criterios.tipo);
        }
        if(criterios.estado){
            query = query.eq('estado', criterios.estado);
        }
        if(criterios.solicitud_id){
            query = query.eq('solicitud_id', criterios.solicitud_id);
        }
        if(criterios.fecha_desde){
            query = query.gte('created_at', criterios.fecha_desde);
        }
        if(criterios.fecha_hasta){
            query = query.lte('created_at', criterios.fecha_hasta);
        }
        query = query.order('created○_at', {ascending: false});
        const { data, error} = await query;
        if( error) throw new Error(`Error buscando documentos: ${error.message}`);
        return data.map(d=>new Documento(d));
    }
    async obtenerParaEvaluacion(operadorId = null){
        let query = this.supabase
            .from('documentos')
            .select(`
                *,
                solicitudes_credito(
                    numero_solicitud,
                    estado,
                    solicitantes: solicitante_id(
                        usuarios(
                            nombre_completo,
                            email
                        )
                    ),
                    operadores: operador_id(
                        usuarios(
                            nombre_completo
                        )
                    )
                )
                `)
            .eq('estado', 'pendiente')
            .order('created_at', {ascending: true});
        if( operadorId){
            query = query.eq('solicitudes_credito.operador_id', operadorId);
        }
        const { data, error} = await query;
        if(error) throw new Error(`Error obteniendo documentos para evaluación: ${error.message}`);
        return data.map(d=>new Documento(d));

    }
    async registrarEvaluacion(evaluacionData){
        const { data, error} = await this.supabase
            .from('condiciones_aprobacion')
            .insert([evaluacionData])
            .select()
            .single();
        if(error) throw new Error(`Error registrando evaluación: ${error.message}`);
        return data;

    }
    async obtenerHistorialEvaluaciones(documentoId){
        const {data, error} = await this.supabase
            .from('condiciones_aprobacion')
            .select(`
                *,
                usuarios: creado_por(
                    nombre_completo,
                    email
                )
                `)
            .eq('documento_id', documentoId)
            .order('created○_at', {ascending: false});
        if( error) throw new Error (`Error obteniendo historial: ${error.message}`);
        return data || [];
    }
    async verificarPermisos(documentoId, usuarioId, usuarioRol){
        try{
            const documento = await this.obtenerPorId(documentoId);
            if(!documento) return false;
            const { data: solicitud, error} = await this.supabase
                .from('solicitudes_credito')
                .select('solicitante_id, operador_id')
                .eq('id', documento.solicitud_id)
                .single();
            if(error || !solicitud) return false;
            if(['admin', 'operador'].includes(usuarioRol)){
                return true;
            }
            if(usuarioRol==='solicitante'){
                return solicitud.solicitante_id === usuarioId;
            }
            return false;
        } catch(error){
            console.error('Error en verificarPermisos:', error);
            return false;
        }
    }
    async obtenerAgrupadosPorTipo(solicitudId){
        const { data:documentos, error} = await this.supabase
            .from('documentos')
            .select('*')
            .eq('solicitud_id', solicitudId)
            .order('tipo', {ascending:true})
            .order('created_at', { ascending:false});
        if(error) throw new Error(`Error obteniendo documentos agrupados: ${error.message}`);
        const agrupados = {};
        if(documentos){
            documentos.forEach(doc=>{
                if(!agrupados[doc.tipo]){
                    agrupados[doc.tipo] = [];
                }
                agrupados[doc.tipo].push(new Documento(doc));
            });
        }
        return agrupados;
    }
    // Métodos de storage
    async subirArchivoStorage(rutaStorage, buffer, contentType){
        const { error} = await this.supabaseAdmin.rutaStorage
            .from('kyc-documents')
            .upload(rutaStorage, buffer,{
                contentType: contentType,
                upsert: false
            });
        if(error) throw new Error(`Error subiendo archivo:${error.message}`);
        return true;
    }
    async eliminarArchivoStorage(rutaStorage){
        const { error}=await this.supabaseAdmin.storage
            .from('kyc-documents')
            .remove([rutaStorage]);
        if(error) throw new Error(`Error eliminando archivo: ${error.message}`);
        return true;
    }
    async descargarArchivo(rutaStorage){
        const { data, error} = await this.supabase.storage
            .from('kyc-documents')
            .download(rutaStorage);
        if(error) throw new Error(`Error descargando archivo: ${error.message}`);
        return data;

    }
    async obtenerUrlPublica(rutaStorage) {
        const { data } = this.supabase.storage
        .from('kyc-documents')
        .getPublicUrl(rutaStorage);

        return data.publicUrl;
    }

}
module.exports = SupabaseDocumentoRepository;
