import { z } from 'zod';
import { UserRole } from '../types/auth.types';


const BaseCredentialsSchema = z.object({
  email: z.string().email('Email no válido').min(1, 'El email es obligatorio'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre_completo: z.string().min(1, 'El nombre completo es obligatorio'),
  telefono: z.string().min(8, 'El teléfono es obligatorio'),
  cedula_identidad: z.string().min(8, 'La cédula es obligatoria'),
  rol: z.nativeEnum(UserRole), // Campo interno para el formulario
});

 export const LoginSchema = z.object({
  email: BaseCredentialsSchema.shape.email,
  password: BaseCredentialsSchema.shape.password,
});
export type LoginSchemaType = z.infer<typeof LoginSchema>;



export const RegisterOperadorSchema = BaseCredentialsSchema.extend({
  // No se necesitan campos de empresa
}).strict();
export type RegisterOperadorSchemaType = z.infer<typeof RegisterOperadorSchema>;



export const RegisterSolicitanteSchema = BaseCredentialsSchema.extend({
  nombre_empresa: z.string().min(2, 'El nombre de la empresa es obligatorio'),
  cuit: z.string().regex(/^\d{2}-\d{8}-\d{1}$/, 'CUIT no válido (ej: 30-12345678-9)'),
  representante_legal: z.string().min(2, 'El representante legal es obligatorio'),
  domicilio: z.string().min(5, 'El domicilio es obligatorio'),
}).strict();
export type RegisterSolicitanteSchemaType = z.infer<typeof RegisterSolicitanteSchema>;



export const ForgotPasswordSchema = z.object({
  email: z.string().email('Email no válido').min(1, 'El email es obligatorio'),
});
export type ForgotPasswordSchemaType = z.infer<typeof ForgotPasswordSchema>;
