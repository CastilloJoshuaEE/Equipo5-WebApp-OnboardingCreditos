// frontend/src/hooks/usePerfil.ts
import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { UsuarioService } from '@/services/usuario.service';
import { 
  PerfilCompleto, 
  PerfilValidationErrors, 
  EditarPerfilInput,
  PerfilUsuario 
} from '@/types/usuario.types';

interface UsePerfilReturn {
  perfil: PerfilCompleto | null;
  perfilBasico: PerfilUsuario | null;
  loading: boolean;
  error: string | null;
  cargarPerfil: () => Promise<void>;
  editarPerfil: (datos: EditarPerfilInput) => Promise<boolean>;
  validarPerfil: (datos: EditarPerfilInput) => PerfilValidationErrors;
}

export const usePerfil = (): UsePerfilReturn => {
  const { data: session } = useSession();
  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null);
  const [perfilBasico, setPerfilBasico] = useState<PerfilUsuario | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarPerfil = useCallback(async () => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);
      
      // Obtener perfil básico (compatible con la respuesta actual)
      const response = await UsuarioService.obtenerPerfil();
      
      if (response.success) {
        // La respuesta viene como PerfilUsuario, no PerfilCompleto
        setPerfilBasico(response.data);
        
        // Para compatibilidad, también lo establecemos como perfil
        // Esto soluciona el error de tipos
        setPerfil(response.data as any);
      } else {
        setError('Error al cargar el perfil');
      }
    } catch (err) {
      console.error('Error en usePerfil:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  }, [session]);

  const editarPerfil = useCallback(async (datos: EditarPerfilInput): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar el servicio de actualización básico
      const response = await UsuarioService.actualizarPerfil(datos);
      
      if (response.success) {
        // Actualizar ambos estados para mantener consistencia
        setPerfilBasico(response.data);
        setPerfil(response.data as any);
        return true;
      } else {
        setError('Error al actualizar el perfil');
        return false;
      }
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar el perfil');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const validarPerfil = useCallback((datos: EditarPerfilInput): PerfilValidationErrors => {
    const errors: PerfilValidationErrors = {};

    // Validación de nombre completo
    if (datos.nombre_completo && datos.nombre_completo.trim().length < 2) {
      errors.nombre_completo = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validación de teléfono
    if (datos.telefono) {
      const telefonoLimpio = datos.telefono.replace(/[\s\-\(\)\.]/g, '');
      const telefonoRegex = /^(\+?\d{1,4})?[\s\-]?\(?(\d{1,4})?\)?[\s\-]?(\d{3,4})[\s\-]?(\d{3,4})$/;
      if (!telefonoRegex.test(datos.telefono)) {
        errors.telefono = 'Formato de teléfono inválido';
      }
    }

    // Validaciones específicas para solicitantes
    // Usar type assertion para acceder a propiedades de solicitante
    const datosConTipo = datos as any;
    
    if (datosConTipo.nombre_empresa && datosConTipo.nombre_empresa.trim().length < 2) {
      errors.nombre_empresa = 'El nombre de empresa debe tener al menos 2 caracteres';
    }

    if (datosConTipo.cuit && !/^\d{2}-\d{8}-\d{1}$/.test(datosConTipo.cuit)) {
      errors.cuit = 'Formato de CUIT inválido. Use: 30-12345678-9';
    }

    if (datosConTipo.representante_legal && datosConTipo.representante_legal.trim().length < 2) {
      errors.representante_legal = 'El representante legal debe tener al menos 2 caracteres';
    }

    if (datosConTipo.domicilio && datosConTipo.domicilio.trim().length < 5) {
      errors.domicilio = 'El domicilio debe tener al menos 5 caracteres';
    }

    return errors;
  }, []);

  return {
    perfil,
    perfilBasico, // Nuevo estado para el perfil básico
    loading,
    error,
    cargarPerfil,
    editarPerfil,
    validarPerfil,
  };
};