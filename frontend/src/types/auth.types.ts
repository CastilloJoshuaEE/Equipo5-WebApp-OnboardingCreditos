export enum UserRole {
  SOLICITANTE = 'solicitante',
  OPERADOR = 'operador',
}


export interface LoginCredentials {
  email: string;
  password: string; 
}

// Interfaz usuario autenticado 
export interface AuthUser {
  id: string;
  email: string;
  nombre_completo: string;
  rol: UserRole;
  
  cuit?: string; 
}

// Interfaz ok del back 

export interface AuthResponse {
user_metadata: Record<string, unknown> ;
   access_token: string;
   token?: string;
  user: AuthUser;
}

// --- Interfaces de Registro ---


export interface RegisterOperador {
  email: string;
  password: string;
  nombre_completo: string;
  telefono: string;
  cedula_identidad: string; // Cédula/DNI
  rol: UserRole.OPERADOR;
}

 
export interface RegisterSolicitante extends Omit<RegisterOperador, 'rol'> {
  // Datos de la PYME/Empresa
  nombre_empresa: string;
  cuit: string; 
  representante_legal: string;
  domicilio: string;
  rol: UserRole.SOLICITANTE;
}
