// frontend/src/services/usuarios/usuario.service.ts
import { api } from '@/lib/axios'; 
import { 

  PerfilPublicoResponse


} from '@/features/usuario/perfil/perfil.responses';
import { PerfilUsuario } from '@/features/usuario/perfil/perfil.types';
import { ApiResponse } from '@/shared/types/api.types';

export const UsuarioService = {

  /**
   * Obtener perfil público de otro usuario (solo para operadores)
   */
  obtenerPerfilUsuario: async (usuarioId: string): Promise<PerfilPublicoResponse> => {
    try {
      const response = await api.get(`/usuarios/${usuarioId}/perfil-publico`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo perfil público:', error);
      throw new Error('No se pudo obtener el perfil del usuario');
    }
  },

  /**
   * Obtener perfil básico (método existente - compatibilidad)
   */
  obtenerPerfil: async (): Promise<{ success: boolean; data: PerfilUsuario }> => {
    try {
      const response = await api.get('/usuario/perfil');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo perfil básico:', error);
      throw new Error('No se pudo obtener el perfil');
    }
  },

  /**
   * Actualizar perfil básico (método existente - compatibilidad)
   */
  actualizarPerfil: async (datosPerfil: Partial<PerfilUsuario>): Promise<{ success: boolean; data: PerfilUsuario }> => {
    try {
      const response = await api.put('/usuario/editar-perfil', datosPerfil);
      return response.data;
    } catch (error: any) {
      console.error('Error actualizando perfil básico:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar el perfil');
    }
  },

  /**
   * Cambiar contraseña del usuario autenticado
   */
  cambiarContrasena: async (datos: {
    contrasena_actual: string;
    nueva_contrasena: string;
    confirmar_contrasena: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.put('/usuario/cambiar-contrasena', datos);
      return response.data;
    } catch (error: any) {
      console.error('Error cambiando contraseña:', error);
      throw new Error(error.response?.data?.message || 'Error al cambiar la contraseña');
    }
  },

  /**
   * Desactivar cuenta del usuario autenticado
   */
  desactivarCuenta: async (datos: {
    password: string;
    motivo?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
      const response = await api.put('/usuario/desactivar-cuenta', datos);
      return response.data;
    } catch (error: any) {
      console.error('Error desactivando cuenta:', error);
      throw new Error(error.response?.data?.message || 'Error al desactivar la cuenta');
    }
  },

  /**
   * Actualizar email de recuperación
   */
  actualizarEmailRecuperacion: async (email_recuperacion: string): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
      const response = await api.put('/usuario/email-recuperacion', {
        email_recuperacion
      });
      return response.data;
    } catch (error: any) {
      console.error('Error actualizando email de recuperación:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar el email de recuperación');
    }
  },

  /**
   * Obtener configuración de cuenta
   */
  obtenerConfiguracionCuenta: async (): Promise<{
    success: boolean;
    data: {
      email_principal: string;
      email_recuperacion?: string;
      cuenta_activa: boolean;
      fecha_desactivacion?: string;
    };
  }> => {
    try {
      const response = await api.get('/usuario/configuracion-cuenta');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo configuración de cuenta:', error);
      throw new Error('No se pudo obtener la configuración de la cuenta');
    }
  },
    eliminarCuentaCompletamente: async (password: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.delete('/usuario/eliminar-cuenta', {
        data: { password }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error eliminando cuenta:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar la cuenta completamente');
    }
  },

};