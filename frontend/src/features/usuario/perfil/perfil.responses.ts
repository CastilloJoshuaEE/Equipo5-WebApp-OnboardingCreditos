// frontend/src/features/usuario/perfil/perfil.responses.ts

import { PerfilCompleto } from './perfil.types';

export interface PerfilResponse {
  success: boolean;
  message: string;
  data: PerfilCompleto;
}

export interface PerfilPublicoData {
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
}

export interface PerfilPublicoResponse {
  success: boolean;
  message: string;
  data: PerfilPublicoData;
}
