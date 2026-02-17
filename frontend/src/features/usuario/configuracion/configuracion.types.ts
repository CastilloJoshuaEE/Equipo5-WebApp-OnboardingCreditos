// frontend/src/features/usuario/configuracion/configuracion.types.ts
export interface ConfiguracionCuenta {
  email_principal: string;
  email_recuperacion?: string;
  cuenta_activa: boolean;
  fecha_desactivacion?: string;
}