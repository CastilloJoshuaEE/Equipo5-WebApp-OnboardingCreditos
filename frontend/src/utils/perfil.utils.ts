// frontend/src/utils/perfil.utils.ts
import { PerfilCompleto } from '@/features/usuario/perfil/perfil.types';
import { PerfilSolicitante } from '@/features/usuario/perfil/perfil.types';
import { PerfilOperador } from '@/features/usuario/perfil/perfil.types';
/**
 * Type guard para verificar si un perfil es de tipo solicitante
 */
export const esPerfilSolicitante = (perfil: PerfilCompleto): perfil is PerfilSolicitante => {
  return perfil.rol === 'solicitante';
};

/**
 * Type guard para verificar si un perfil es de tipo operador
 */
export const esPerfilOperador = (perfil: PerfilCompleto): perfil is PerfilOperador => {
  return perfil.rol === 'operador';
};

/**
 * Obtener el color del chip según el rol
 */
export const obtenerColorRol = (rol: string): 'primary' | 'secondary' | 'default' => {
  switch (rol) {
    case 'operador':
      return 'primary';
    case 'solicitante':
      return 'secondary';
    default:
      return 'default';
  }
};

/**
 * Obtener el color del chip según el estado de la cuenta
 */
export const obtenerColorEstadoCuenta = (activa: boolean): 'success' | 'error' => {
  return activa ? 'success' : 'error';
};

/**
 * Formatear fecha para mostrar
 */
export const formatearFecha = (fecha: string): string => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Validar formato de CUIT
 */
export const validarCUIT = (cuit: string): boolean => {
  return /^\d{2}-\d{8}-\d{1}$/.test(cuit);
};

/**
 * Validar formato de teléfono
 */
export const validarTelefono = (telefono: string): boolean => {
  const telefonoLimpio = telefono.replace(/[\s\-\(\)\.]/g, '');
  const telefonoRegex = /^(\+?\d{1,4})?[\s\-]?\(?(\d{1,4})?\)?[\s\-]?(\d{3,4})[\s\-]?(\d{3,4})$/;
  return telefonoRegex.test(telefono);
};