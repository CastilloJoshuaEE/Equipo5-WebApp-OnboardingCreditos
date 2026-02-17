// frontend/src/schemas/usuario.schema.ts
import { z } from 'zod';

// Esquema base para edición de perfil
export const EditarPerfilBaseSchema = z.object({
  nombre_completo: z.string()
    .min(2, 'El nombre completo debe tener al menos 2 caracteres')
    .optional(),
  
  telefono: z.string()
    .refine((val) => {
      if (!val) return true; // Opcional
      const telefonoLimpio = val.replace(/[\s\-\(\)\.]/g, '');
      const telefonoRegex = /^(\+?\d{1,4})?[\s\-]?\(?(\d{1,4})?\)?[\s\-]?(\d{3,4})[\s\-]?(\d{3,4})$/;
      return telefonoRegex.test(val);
    }, 'Formato de teléfono inválido')
    .optional(),
  
  direccion: z.string().optional(),
});

// Esquema para solicitantes
export const EditarPerfilSolicitanteSchema = EditarPerfilBaseSchema.extend({
  nombre_empresa: z.string()
    .min(2, 'El nombre de la empresa debe tener al menos 2 caracteres')
    .optional(),
  
  cuit: z.string()
    .refine((val) => {
      if (!val) return true; // Opcional
      return /^\d{2}-\d{8}-\d{1}$/.test(val);
    }, 'Formato de CUIT inválido. Use: 30-12345678-9')
    .optional(),
  
  representante_legal: z.string()
    .min(2, 'El representante legal debe tener al menos 2 caracteres')
    .optional(),
  
  domicilio: z.string()
    .min(5, 'El domicilio debe tener al menos 5 caracteres')
    .optional(),
});

// Esquema para cambio de contraseña
export const CambiarContrasenaSchema = z.object({
  contrasena_actual: z.string().min(1, 'La contraseña actual es requerida'),
  nueva_contrasena: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  confirmar_contrasena: z.string().min(1, 'La confirmación de contraseña es requerida'),
}).refine((data) => data.nueva_contrasena === data.confirmar_contrasena, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmar_contrasena'],
});

// Esquema para desactivar cuenta
export const DesactivarCuentaSchema = z.object({
  password: z.string().min(1, 'La contraseña es requerida'),
  motivo: z.string().optional(),
});

// Esquema para email de recuperación
export const EmailRecuperacionSchema = z.object({
  email_recuperacion: z.string()
    .min(1, 'El email de recuperación es requerido')
    .email('Email de recuperación no válido')
    .refine((email) => {
      // No permitir el mismo email principal (se valida en el componente)
      return true;
    }),
});

// Tipos inferidos
export type EditarPerfilBaseInput = z.infer<typeof EditarPerfilBaseSchema>;
export type EditarPerfilSolicitanteInput = z.infer<typeof EditarPerfilSolicitanteSchema>;
export type CambiarContrasenaInput = z.infer<typeof CambiarContrasenaSchema>;
export type DesactivarCuentaInput = z.infer<typeof DesactivarCuentaSchema>;
export type EmailRecuperacionInput = z.infer<typeof EmailRecuperacionSchema>;