export enum UserRole {
  SOLICITANTE = 'solicitante',
  OPERADOR = 'operador'
}

export interface AuthUser {
  id: number;
  email: string;
  nombre_completo: string;
  dni: string;
  telefono: string;
  rol: UserRole;
  email_confirmado: boolean;
  activo: boolean;
  fecha_creacion: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterSolicitante {
  email: string;
  password: string;
  nombre_completo: string;
  dni: string;
  telefono: string;
  rol: UserRole.SOLICITANTE;
  nombre_empresa: string;
  cuit: string;
  representante_legal: string;
  domicilio: string;
}

export interface RegisterOperador {
  email: string;
  password: string;
  nombre_completo: string;
  dni: string;
  telefono: string;
  rol: UserRole.OPERADOR;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}
