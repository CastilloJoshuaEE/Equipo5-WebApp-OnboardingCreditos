// backend/infrastructure/repositories/SupabaseDocumentoRepository.js
const DocumentoRepository = require('../../domain/repositories/DocumentoRepository');
const Documento = require('../../domain/entities/Documento');
const { v4: uuidv4 } = require('uuid');

class SupabaseDocumentoRepository extends DocumentoRepository {
    constructor(supabase, supabaseAdmin) {
        super();
        this.supabase = supabase;
        this.supabaseAdmin = supabaseAdmin;
    }
    
    // Método principal que debería ser llamado
    async create(documentoData) {
        try {
            // Asegurar que tenga ID
            const dataToInsert = {
                id: uuidv4(), // Generar UUID automáticamente
                ...documentoData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            console.log('Insertando documento con ID:', dataToInsert.id);
            
            const { data, error } = await this.supabaseAdmin
                .from('documentos')
                .insert([dataToInsert])
                .select()
                .single();
                
            if (error) {
                console.error('Error en create:', error);
                throw new Error(`Error creando documento: ${error.message}`);
            }
            
            return new Documento(data);
        } catch (error) {
            console.error('Error en create:', error);
            throw error;
        }
    }
    
    // Mantener por compatibilidad, pero redirigir a create
    async crear(documentoData) {
        return this.create(documentoData);
    }
    
    async actualizar(id, updates) {
        try {
            const { data, error } = await this.supabaseAdmin
                .from('documentos')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();
                
            if (error) {
                console.error('Error actualizando documento:', error);
                throw new Error(`Error actualizando documento: ${error.message}`);
            }
            
            return new Documento(data);
        } catch (error) {
            console.error('Error en actualizar:', error);
            throw error;
        }
    }
    
    async eliminar(id) {
        try {
            const { error } = await this.supabaseAdmin
                .from('documentos')
                .delete()
                .eq('id', id);
                
            if (error) {
                console.error('Error eliminando documento:', error);
                throw new Error(`Error eliminando documento: ${error.message}`);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error en eliminar:', error);
            throw error;
        }
    }

    async obtenerPorId(id) {
        try {
            const { data, error } = await this.supabase
                .from('documentos')
                .select('*')
                .eq('id', id)
                .single();
                
            if (error) {
                if (error.code === 'PGRST116') return null;
                throw error;
            }
            
            return new Documento(data);
        } catch (error) {
            console.error('Error obteniendo documento por ID:', error);
            return null;
        }
    }
    
    async obtenerPorSolicitud(solicitudId) {
        try {
            const { data, error } = await this.supabase
                .from('documentos')
                .select('*')
                .eq('solicitud_id', solicitudId)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            return data.map(d => new Documento(d));
        } catch (error) {
            console.error('Error obteniendo documentos por solicitud:', error);
            throw new Error(`Error obteniendo documentos: ${error.message}`);
        }
    }
    
    async obtenerPorTipoYSolicitud(solicitudId, tipo) {
        try {
            const { data, error } = await this.supabase
                .from('documentos')
                .select('*')
                .eq('solicitud_id', solicitudId)
                .eq('tipo', tipo)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            return data.map(d => new Documento(d));
        } catch (error) {
            console.error('Error obteniendo documentos por tipo:', error);
            throw new Error(`Error obteniendo documentos por tipo: ${error.message}`);
        }
    }
    
    async obtenerPorEstado(solicitudId, estado) {
        try {
            const { data, error } = await this.supabase
                .from('documentos')
                .select('*')
                .eq('solicitud_id', solicitudId)
                .eq('estado', estado)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            return data.map(d => new Documento(d));
        } catch (error) {
            console.error('Error obteniendo documentos por estado:', error);
            throw new Error(`Error obteniendo documentos por estado: ${error.message}`);
        }
    }
    
    async contarPorTipoYEstado(solicitudId, tipo, estado) {
        try {
            const { count, error } = await this.supabase
                .from('documentos')
                .select('*', { count: 'exact', head: true })
                .eq('solicitud_id', solicitudId)
                .eq('tipo', tipo)
                .eq('estado', estado);
                
            if (error) throw error;
            
            return count || 0;
        } catch (error) {
            console.error('Error contando documentos:', error);
            throw new Error(`Error contando documentos: ${error.message}`);
        }
    }
    
    async verificarDocumentosObligatorios(solicitudId) {
        try {
            const tiposObligatorios = ['dni', 'cuit', 'comprobante_domicilio'];
            
            const { data: documentos, error } = await this.supabase
                .from('documentos')
                .select('tipo, estado')
                .eq('solicitud_id', solicitudId)
                .in('tipo', tiposObligatorios);
            
            if (error) {
                console.error('Error verificando documentos:', error);
                throw new Error(`Error verificando documentos: ${error.message}`);
            }
            
            const documentosArray = documentos || [];
            const tiposSubidos = documentosArray.map(doc => doc.tipo);
            const documentosFaltantes = tiposObligatorios.filter(tipo => !tiposSubidos.includes(tipo));
            
            const documentosInvalidados = documentosArray.filter(doc => doc.estado !== 'validado');
            const todosValidados = documentosInvalidados.length === 0;
            
            return {
                completos: documentosFaltantes.length === 0,
                todos_validados: todosValidados,
                documentos_faltantes: documentosFaltantes,
                documentos_subidos: tiposSubidos,
                documentos_invalidados: documentosInvalidados.map(doc => doc.tipo)
            };
        } catch (error) {
            console.error('Error en verificarDocumentosObligatorios:', error);
            throw error;
        }
    }
    
    async obtenerEstadisticas(solicitudId) {
        try {
            const { data: documentos, error } = await this.supabase
                .from('documentos')
                .select('tipo, estado')
                .eq('solicitud_id', solicitudId);
                
            if (error) throw error;
            
            const estadisticas = {
                total: documentos?.length || 0,
                por_tipo: {},
                por_estado: {
                    pendiente: 0,
                    validado: 0,
                    rechazado: 0
                }
            };
            
            if (documentos) {
                documentos.forEach(doc => {
                    if (!estadisticas.por_tipo[doc.tipo]) {
                        estadisticas.por_tipo[doc.tipo] = 0;
                    }
                    estadisticas.por_tipo[doc.tipo]++;
                    
                    if (estadisticas.por_estado[doc.estado] !== undefined) {
                        estadisticas.por_estado[doc.estado]++;
                    }
                });
            }
            
            return estadisticas;
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            throw new Error(`Error obteniendo estadísticas: ${error.message}`);
        }
    }
    
    async obtenerRecientes(limite = 10) {
        try {
            const { data, error } = await this.supabase
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
                .order('created_at', { ascending: false })
                .limit(limite);
                
            if (error) throw error;
            
            return data.map(d => new Documento(d));
        } catch (error) {
            console.error('Error obteniendo documentos recientes:', error);
            throw new Error(`Error obteniendo documentos recientes: ${error.message}`);
        }
    }
    
    async buscar(criterios) {
        try {
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
                
            if (criterios.tipo) {
                query = query.eq('tipo', criterios.tipo);
            }
            if (criterios.estado) {
                query = query.eq('estado', criterios.estado);
            }
            if (criterios.solicitud_id) {
                query = query.eq('solicitud_id', criterios.solicitud_id);
            }
            if (criterios.fecha_desde) {
                query = query.gte('created_at', criterios.fecha_desde);
            }
            if (criterios.fecha_hasta) {
                query = query.lte('created_at', criterios.fecha_hasta);
            }
            
            query = query.order('created_at', { ascending: false });
            
            const { data, error } = await query;
            if (error) throw error;
            
            return data.map(d => new Documento(d));
        } catch (error) {
            console.error('Error buscando documentos:', error);
            throw new Error(`Error buscando documentos: ${error.message}`);
        }
    }
    
    async obtenerParaEvaluacion(operadorId = null) {
        try {
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
                .order('created_at', { ascending: true });
                
            if (operadorId) {
                query = query.eq('solicitudes_credito.operador_id', operadorId);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            
            return data.map(d => new Documento(d));
        } catch (error) {
            console.error('Error obteniendo documentos para evaluación:', error);
            throw new Error(`Error obteniendo documentos para evaluación: ${error.message}`);
        }
    }
    
    async registrarEvaluacion(evaluacionData) {
        try {
            const { data, error } = await this.supabase
                .from('condiciones_aprobacion')
                .insert([evaluacionData])
                .select()
                .single();
                
            if (error) throw error;
            
            return data;
        } catch (error) {
            console.error('Error registrando evaluación:', error);
            throw new Error(`Error registrando evaluación: ${error.message}`);
        }
    }
    
    async obtenerHistorialEvaluaciones(documentoId) {
        try {
            const { data, error } = await this.supabase
                .from('condiciones_aprobacion')
                .select(`
                    *,
                    usuarios: creado_por(
                        nombre_completo,
                        email
                    )
                `)
                .eq('documento_id', documentoId)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            return data || [];
        } catch (error) {
            console.error('Error obteniendo historial:', error);
            throw new Error(`Error obteniendo historial: ${error.message}`);
        }
    }
    
    async verificarPermisos(documentoId, usuarioId, usuarioRol) {
        try {
            const documento = await this.obtenerPorId(documentoId);
            if (!documento) return false;
            
            const { data: solicitud, error } = await this.supabase
                .from('solicitudes_credito')
                .select('solicitante_id, operador_id')
                .eq('id', documento.solicitud_id)
                .single();
                
            if (error || !solicitud) return false;
            
            if (['admin', 'operador'].includes(usuarioRol)) {
                return true;
            }
            
            if (usuarioRol === 'solicitante') {
                return solicitud.solicitante_id === usuarioId;
            }
            
            return false;
        } catch (error) {
            console.error('Error en verificarPermisos:', error);
            return false;
        }
    }
    
    async obtenerAgrupadosPorTipo(solicitudId) {
        try {
            const { data: documentos, error } = await this.supabase
                .from('documentos')
                .select('*')
                .eq('solicitud_id', solicitudId)
                .order('tipo', { ascending: true })
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            const agrupados = {};
            if (documentos) {
                documentos.forEach(doc => {
                    if (!agrupados[doc.tipo]) {
                        agrupados[doc.tipo] = [];
                    }
                    agrupados[doc.tipo].push(new Documento(doc));
                });
            }
            
            return agrupados;
        } catch (error) {
            console.error('Error obteniendo documentos agrupados:', error);
            throw new Error(`Error obteniendo documentos agrupados: ${error.message}`);
        }
    }
    
    // Métodos de storage
    async subirArchivoStorage(rutaStorage, buffer, contentType) {
        try {
            const { error } = await this.supabaseAdmin.storage
                .from('kyc-documents')
                .upload(rutaStorage, buffer, {
                    contentType: contentType,
                    upsert: false
                });
                
            if (error) throw error;
            
            return true;
        } catch (error) {
            console.error('Error subiendo archivo:', error);
            throw new Error(`Error subiendo archivo: ${error.message}`);
        }
    }
    
    async eliminarArchivoStorage(rutaStorage) {
        try {
            const { error } = await this.supabaseAdmin.storage
                .from('kyc-documents')
                .remove([rutaStorage]);
                
            if (error) throw error;
            
            return true;
        } catch (error) {
            console.error('Error eliminando archivo:', error);
            throw new Error(`Error eliminando archivo: ${error.message}`);
        }
    }
    
    async descargarArchivo(rutaStorage) {
        try {
            const { data, error } = await this.supabase.storage
                .from('kyc-documents')
                .download(rutaStorage);
                
            if (error) throw error;
            
            return data;
        } catch (error) {
            console.error('Error descargando archivo:', error);
            throw new Error(`Error descargando archivo: ${error.message}`);
        }
    }
    
    async obtenerUrlPublica(rutaStorage) {
        try {
            const { data } = this.supabase.storage
                .from('kyc-documents')
                .getPublicUrl(rutaStorage);
                
            return data.publicUrl;
        } catch (error) {
            console.error('Error obteniendo URL pública:', error);
            throw new Error(`Error obteniendo URL pública: ${error.message}`);
        }
    }
}

module.exports = SupabaseDocumentoRepository;