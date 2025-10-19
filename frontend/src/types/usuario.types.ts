// Tipos para perfil de usuario
export interface PerfilUsuario {
  id: string;
  email: string;
  nombre_completo: string;
  telefono: string;
  dni: string;
  rol: 'solicitante' | 'operador';
  cuenta_activa: boolean;
  created_at: string;
  updated_at: string;
  direccion?: string;
  email_recuperacion?: string;
  fecha_desactivacion?: string;
}

export interface PerfilSolicitante extends PerfilUsuario {
  rol: 'solicitante';
  solicitantes: {
    id: string;
    tipo: string;
    nombre_empresa: string;
    cuit: string;
    representante_legal: string;
    domicilio: string;
    created_at: string;
    updated_at: string;
  };
}

export interface PerfilOperador extends PerfilUsuario {
  rol: 'operador';
  operadores: {
    id: string;
    nivel: 'analista' | 'supervisor';
    permisos: string[];
    created_at: string;
    updated_at: string;
  };
}

export type PerfilCompleto = PerfilSolicitante | PerfilOperador;

// Tipos para formularios de edición
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

export type EditarPerfilInput = EditarPerfilBase | EditarPerfilSolicitante;

// Tipos para respuestas de la API
export interface PerfilResponse {
  success: boolean;
  message: string;
  data: PerfilCompleto;
}

export interface PerfilPublicoResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    nombre_completo: string;
    email: string;
    telefono: string;
    rol: string;
    cuenta_activa: boolean;
    created_at: string;
    datos_empresa?: {
      nombre_empresa: string;
      cuit: string;
      representante_legal: string;
      domicilio: string;
      tipo: string;
    };
    datos_operador?: {
      nivel: string;
      permisos: string[];
    };
  };
}

// Tipos para validación
export interface PerfilValidationErrors {
  nombre_completo?: string;
  telefono?: string;
  direccion?: string;
  nombre_empresa?: string;
  cuit?: string;
  representante_legal?: string;
  domicilio?: string;
}