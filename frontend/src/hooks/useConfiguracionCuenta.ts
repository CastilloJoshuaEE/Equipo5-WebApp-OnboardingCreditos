import { useState, useCallback } from 'react';
import { UsuarioService } from '@/services/usuario.service';

interface ConfiguracionCuenta {
  email_principal: string;
  email_recuperacion?: string;
  cuenta_activa: boolean;
  fecha_desactivacion?: string;
}

interface UseConfiguracionCuentaReturn {
  configuracion: ConfiguracionCuenta | null;
  loading: boolean;
  error: string | null;
  cargarConfiguracion: () => Promise<void>;
  actualizarEmailRecuperacion: (email: string) => Promise<boolean>;
  desactivarCuenta: (password: string, motivo?: string) => Promise<boolean>;
  cambiarContrasena: (datos: {
    contrasena_actual: string;
    nueva_contrasena: string;
    confirmar_contrasena: string;
  }) => Promise<boolean>;
}

export const useConfiguracionCuenta = (): UseConfiguracionCuentaReturn => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionCuenta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarConfiguracion = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await UsuarioService.obtenerConfiguracionCuenta();
      if (response.success) {
        setConfiguracion(response.data);
      } else {
        setError('Error al cargar la configuración');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarEmailRecuperacion = useCallback(async (email: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await UsuarioService.actualizarEmailRecuperacion(email);
      if (response.success) {
        // Actualizar la configuración local
        setConfiguracion(prev => prev ? { ...prev, email_recuperacion: email } : null);
        return true;
      } else {
        setError(response.message);
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el email de recuperación');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const desactivarCuenta = useCallback(async (password: string, motivo?: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await UsuarioService.desactivarCuenta({ password, motivo });
      return response.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al desactivar la cuenta');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const cambiarContrasena = useCallback(async (datos: {
    contrasena_actual: string;
    nueva_contrasena: string;
    confirmar_contrasena: string;
  }): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await UsuarioService.cambiarContrasena(datos);
      if (response.success) {
        return true;
      } else {
        setError(response.message);
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    configuracion,
    loading,
    error,
    cargarConfiguracion,
    actualizarEmailRecuperacion,
    desactivarCuenta,
    cambiarContrasena,
  };
};