// frontend/src/features/usuario/configuracion/useConfiguracion.types.ts
import { ConfiguracionCuenta } from "./configuracion.types";
export interface UseConfiguracionCuentaReturn {
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
