// frontend/src/features/usuario/perfil/perfil.types.ts
export type RolUsuario = 'solicitante' | 'operador';

export interface PerfilUsuario {
  id: string;
  email: string;
  nombre_completo: string;
  telefono: string;
  dni: string;
  rol: RolUsuario;
  cuenta_activa: boolean;
  created_at: string;
  updated_at: string;
  direccion?: string;
  email_recuperacion?: string;
  fecha_desactivacion?: string;
}

export interface DatosSolicitante {
  id?: string;
  tipo?: string;
  nombre_empresa?: string;
  cuit?: string;
  representante_legal?: string;
  domicilio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DatosOperador {
  id: string;
  nivel: 'analista' | 'supervisor';
  permisos: string[];
  created_at: string;
  updated_at: string;
}

export interface PerfilSolicitante extends PerfilUsuario {
  rol: 'solicitante';
  solicitantes: DatosSolicitante;
}

export interface PerfilOperador extends PerfilUsuario {
  rol: 'operador';
  operadores: DatosOperador;
}

export type PerfilCompleto = PerfilSolicitante | PerfilOperador;