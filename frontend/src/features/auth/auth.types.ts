// frontend/src/features/auth/auth.types.ts

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
export interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  accessToken?: string;
}
