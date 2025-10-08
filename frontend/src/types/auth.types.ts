// /types/auth.ts
export enum UserRole {
  SOLICITANTE = 'solicitante',
  OPERADOR = 'operador',
}

export interface AuthUser {
  id: string;
  email: string;
  nombre_completo: string;
  dni: string;
  telefono: string;
  rol: UserRole;
  cuenta_activa: boolean;
  created_at?: string;
  updated_at?: string;
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
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    profile: AuthUser;
    session?: any;
  };
}

export type LoginInput = {
  email: string;
  password: string;
};
