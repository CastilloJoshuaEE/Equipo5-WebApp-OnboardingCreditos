// backend/infrastructure/repositories/SupabasePlantillaDocumentoRepository.js
const PlantillaDocumentoRepository = require('../../domain/repositories/PlantillaDocumentoRepository');
const PlantillaDocumento = require('../../domain/entities/PlantillaDocumento');

class SupabasePlantillaDocumentoRepository extends PlantillaDocumentoRepository {
  constructor(supabase, supabaseAdmin) {
    super();
    this.supabase = supabase;
    this.supabaseAdmin = supabaseAdmin;
  }

  async listar() {
    const { data, error } = await this.supabase
      .from('plantilla_documentos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error listando plantillas: ${error.message}`);
    return data.map(p => new PlantillaDocumento(p));
  }

  async obtenerPorId(id) {
    const { data, error } = await this.supabase
      .from('plantilla_documentos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return new PlantillaDocumento(data);
  }

  async obtenerPorTipo(tipo) {
    const { data, error } = await this.supabase
      .from('plantilla_documentos')
      .select('*')
      .eq('tipo', tipo)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error obteniendo plantillas por tipo: ${error.message}`);
    return data.map(p => new PlantillaDocumento(p));
  }

  async obtenerActivaPorTipo(tipo) {
    const { data, error } = await this.supabase
      .from('plantilla_documentos')
      .select('*')
      .eq('tipo', tipo)
      .eq('activa', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? new PlantillaDocumento(data) : null;
  }

  async crear(plantillaData) {
    const { data, error } = await this.supabaseAdmin
      .from('plantilla_documentos')
      .insert([{
        ...plantillaData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw new Error(`Error creando plantilla: ${error.message}`);
    return new PlantillaDocumento(data);
  }

  async actualizar(id, updateData) {
    const { data, error } = await this.supabaseAdmin
      .from('plantilla_documentos')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando plantilla: ${error.message}`);
    return new PlantillaDocumento(data);
  }

  async eliminar(id) {
    const plantilla = await this.obtenerPorId(id);
    if (!plantilla) {
      throw new Error('Plantilla no encontrada');
    }

    const { error: storageError } = await this.supabaseAdmin.storage
      .from('kyc-documents')
      .remove([plantilla.ruta_storage]);

    if (storageError) {
      console.error('Error eliminando archivo de storage:', storageError);
    }

    const { error: deleteError } = await this.supabaseAdmin
      .from('plantilla_documentos')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return {
      success: true,
      message: 'Plantilla eliminada exitosamente',
      plantilla_eliminada: plantilla
    };
  }

  async marcarComoActiva(id, tipo) {
    const { error: desactivarError } = await this.supabaseAdmin
      .from('plantilla_documentos')
      .update({
        activa: false,
        updated_at: new Date().toISOString()
      })
      .eq('tipo', tipo)
      .eq('activa', true);

    if (desactivarError) throw desactivarError;

    const plantillaActivada = await this.actualizar(id, { activa: true });

    return plantillaActivada;
  }

  async obtenerEstadisticas() {
    const { count: total, error: totalError } = await this.supabase
      .from('plantilla_documentos')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    const { data: porTipo, error: tipoError } = await this.supabase
      .from('plantilla_documentos')
      .select('tipo')
      .eq('activa', true);

    if (tipoError) throw tipoError;

    const tipos = {};
    if (porTipo) {
      porTipo.forEach(item => {
        tipos[item.tipo] = (tipos[item.tipo] || 0) + 1;
      });
    }

    const { data: todasPlantillas, error: plantillasError } = await this.supabase
      .from('plantilla_documentos')
      .select('tamanio_bytes');

    if (plantillasError) throw plantillasError;

    const tamanioTotal = todasPlantillas?.reduce((sum, plantilla) =>
      sum + (plantilla.tamanio_bytes || 0), 0) || 0;

    return {
      total: total || 0,
      por_tipo: tipos,
      tamanio_total_bytes: tamanioTotal,
      tamanio_total_mb: (tamanioTotal / (1024 * 1024)).toFixed(2)
    };
  }

  async buscar(termino) {
    const { data, error } = await this.supabase
      .from('plantilla_documentos')
      .select('*')
      .or(`nombre_archivo.ilike.%${termino}%,tipo.ilike.%${termino}%`)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error buscando plantillas: ${error.message}`);
    return data.map(p => new PlantillaDocumento(p));
  }

  async verificarNombreExistente(nombreArchivo, excluirId = null) {
    let query = this.supabase
      .from('plantilla_documentos')
      .select('id')
      .eq('nombre_archivo', nombreArchivo);

    if (excluirId) {
      query = query.neq('id', excluirId);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error verificando nombre: ${error.message}`);
    return data && data.length > 0;
  }

  async subirArchivoStorage(rutaStorage, buffer, contentType) {
    const { error } = await this.supabaseAdmin.storage
      .from('kyc-documents')
      .upload(rutaStorage, buffer, {
        upsert: true,
        contentType: contentType,
      });

    if (error) throw new Error(`Error subiendo archivo: ${error.message}`);
    return true;
  }

  async eliminarArchivoStorage(rutaStorage) {
    const { error } = await this.supabaseAdmin.storage
      .from('kyc-documents')
      .remove([rutaStorage]);

    if (error) throw new Error(`Error eliminando archivo: ${error.message}`);
    return true;
  }

  async descargarArchivo(rutaStorage) {
    const { data, error } = await this.supabase.storage
      .from('kyc-documents')
      .download(rutaStorage);

    if (error) throw new Error(`Error descargando archivo: ${error.message}`);
    return data;
  }

  async verificarArchivoExiste(rutaStorage) {
    try {
      const { data, error } = await this.supabase.storage
        .from('kyc-documents')
        .list('plantilla', {
          search: rutaStorage.replace('plantilla/', '')
        });

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error verificando archivo:', error);
      return false;
    }
  }

  async obtenerHistorial(id) {
    const { data, error } = await this.supabase
      .from('auditoria_plantillas')
      .select(`
        *,
        usuarios: usuario_id(
          nombre_completo,
          email
        )
      `)
      .eq('plantilla_id', id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error obteniendo historial: ${error.message}`);
    return data || [];
  }

  async registrarAuditoria(auditoriaData) {
    const { data, error } = await this.supabaseAdmin
      .from('auditoria_plantillas')
      .insert([{
        ...auditoriaData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw new Error(`Error registrando auditoría: ${error.message}`);
    return data;
  }
}

module.exports = SupabasePlantillaDocumentoRepository;