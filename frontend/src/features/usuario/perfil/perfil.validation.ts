// frontend/src/features/usuario/perfil/perfil.validation.ts

export interface PerfilValidationErrors {
  nombre_completo?: string;
  telefono?: string;
  direccion?: string;
  nombre_empresa?: string;
  cuit?: string;
  representante_legal?: string;
  domicilio?: string;
}
