export type UserRole = 'solicitante' | 'operador';
export interface Session {  user: User; expires: string;}

export interface Token {  id: string;   email: string;   nombre_completo: string;   rol: UserRole;}
export interface LoginCredentials {   email: string;   password: string; }
export interface User {id: string; email: string; nombre_completo: string; rol: UserRole; cuit?: string; }
export interface AuthResponse { access_token: string; token?: string; user: User;}

