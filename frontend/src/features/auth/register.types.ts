// frontend/src/features/auth/register.types.ts

import { UserRole } from './auth.types';

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
