// frontend/src/features/usuario/perfil/perfil.forms.ts

export interface EditarPerfilBase {
  nombre_completo?: string;
  telefono?: string;
  direccion?: string;
}

export interface EditarPerfilSolicitante extends EditarPerfilBase {
  nombre_empresa?: string;
  cuit?: string;
  representante_legal?: string;
  domicilio?: string;
}

export interface EditarPerfilInput {
  nombre_completo?: string;
  telefono?: string;
  direccion?: string;

  // solo si es solicitante
  nombre_empresa?: string;
  cuit?: string;
  representante_legal?: string;
  domicilio?: string;
}