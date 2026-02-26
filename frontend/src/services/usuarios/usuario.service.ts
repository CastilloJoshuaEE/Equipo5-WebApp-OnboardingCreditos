// frontend/src/services/usuarios/usuario.service.ts
import { api } from '@/lib/axios';
import { PerfilPublicoResponse } from '@/features/usuario/perfil/perfil.responses';
import { PerfilUsuario } from '@/features/usuario/perfil/perfil.types';
import { ApiResponse } from '@/shared/types/api.types';
import { AxiosError } from 'axios';
import { DesactivarCuentaResponse } from '@/features/usuario/configuracion/configuracion.types';

export const UsuarioService = {

  /**
   * Obtener perfil público de otro usuario (solo para operadores)
   */
  obtenerPerfilUsuario: async (usuarioId: string): Promise<PerfilPublicoResponse> => {
    try {
      const response = await api.get<PerfilPublicoResponse>(
        `/usuarios/${usuarioId}/perfil-publico`
      );
      return response.data;
    } catch (error) {
      console.error('Error obteniendo perfil público:', error);
      throw new Error('No se pudo obtener el perfil del usuario');
    }
  },

  /**
   * Obtener perfil básico
   */
  obtenerPerfil: async (): Promise<{ success: boolean; data: PerfilUsuario }> => {
    try {
      const response = await api.get<{ success: boolean; data: PerfilUsuario }>(
        '/usuarioautenticado/perfil'
      );
      return response.data;
    } catch (error) {
      console.error('Error obteniendo perfil básico:', error);
      throw new Error('No se pudo obtener el perfil');
    }
  },

  /**
   * Actualizar perfil
   */
  actualizarPerfil: async (
    datosPerfil: Partial<PerfilUsuario>
  ): Promise<{ success: boolean; data: PerfilUsuario }> => {
    try {
      const response = await api.put<{ success: boolean; data: PerfilUsuario }>(
        '/usuarioautenticado/editar-perfil',
        datosPerfil
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      throw new Error(err.response?.data?.message || 'Error al actualizar el perfil');
    }
  },
  /**
   * Actualizar email de recuperación
   */
  actualizarEmailRecuperacion: async (email_recuperacion: string): Promise<{ success: boolean; message: string;}> => {
    try {
      const response = await api.put<{ success: boolean; message: string; }>(
        '/usuarioautenticado/email-recuperacion',
        { email_recuperacion }
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      throw new Error(err.response?.data?.message || 'Error al actualizar el email de recuperación');
    }
  },
  /**
   * Cambiar contraseña
   */
  cambiarContrasena: async (datos: {
    contrasena_actual: string;
    nueva_contrasena: string;
    confirmar_contrasena: string;
  }): Promise<{ success: boolean; message: string }> => {

    try {
      const response = await api.put<{ success: boolean; message: string }>(
        '/usuarioautenticado/cambiar-contrasena',
        datos
      );

      return response.data;

    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      throw new Error(err.response?.data?.message || 'Error al cambiar la contraseña');
    }
  },

  /**
   * Desactivar cuenta
   */
  desactivarCuenta: async (datos: {
    password: string;
    motivo?: string;
  }): Promise<DesactivarCuentaResponse> => {

    try {
      const response = await api.put<DesactivarCuentaResponse>(
        '/usuarioautenticado/desactivar-cuenta',
        datos
      );

      return response.data;

    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      throw new Error(err.response?.data?.message || 'Error al desactivar la cuenta');
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

      const response = await api.get<{
        success: boolean;
        data: {
          email_principal: string;
          email_recuperacion?: string;
          cuenta_activa: boolean;
          fecha_desactivacion?: string;
        };
      }>('/usuarioautenticado/configuracion-cuenta');

      return response.data;

    } catch (error) {
      console.error('Error obteniendo configuración de cuenta:', error);
      throw new Error('No se pudo obtener la configuración de la cuenta');
    }
  },

  /**
   * Eliminar cuenta completamente
   */
  eliminarCuentaCompletamente: async (
    password: string
  ): Promise<ApiResponse<{ message: string }>> => {

    try {
      const response = await api.delete<ApiResponse<{ message: string }>>(
        '/usuarioautenticado/eliminar-cuenta',
        { data: { password } }
      );

      return response.data;

    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      throw new Error(
        err.response?.data?.message || 'Error al eliminar la cuenta completamente'
      );
    }
  },

};