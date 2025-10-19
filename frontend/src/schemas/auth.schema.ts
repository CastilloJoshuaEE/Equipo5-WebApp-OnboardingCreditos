import { z } from 'zod';

const BaseCredentialsSchema = z.object({
  email: z.string()
    .min(1, 'El email es obligatorio')
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), 'Email no válido'),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 8 caracteres'),
  nombre_completo: z.string()
    .min(1, 'El nombre completo es obligatorio'),
  telefono: z.string()
    .min(8, 'El teléfono es obligatorio'),
  dni: z.string()
    .min(8, 'El DNI es obligatorio'),
  rol: z.enum(['solicitante', 'operador']),
});

// Schema para login
export const loginSchema = z.object({
  email: BaseCredentialsSchema.shape.email,
  password: BaseCredentialsSchema.shape.password,
});
export type LoginInput = z.infer<typeof loginSchema>;

// Schema unificado para registro (incluye campos opcionales para solicitante)
export const registerSchema = z.object({
  email: z.string()
    .min(1, 'El email es obligatorio')
    .email('Email no válido'),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 8 caracteres'),
  nombre_completo: z.string()
    .min(1, 'El nombre completo es obligatorio'),
  telefono: z.string()
    .min(8, 'El teléfono es obligatorio'),
  dni: z.string()
    .min(8, 'El DNI es obligatorio'),
  rol: z.enum(['solicitante', 'operador'], {
    message: 'Debe seleccionar un rol'
  }),
  nombre_empresa: z.string().optional(),
  cuit: z.string().optional(),
  representante_legal: z.string().optional(),
  domicilio: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.rol === 'solicitante') {
    if (!data.nombre_empresa || data.nombre_empresa.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El nombre de la empresa es obligatorio para solicitantes",
        path: ["nombre_empresa"]
      });
    }
    
    if (!data.cuit || !/^\d{2}-\d{8}-\d{1}$/.test(data.cuit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CUIT no válido (formato: 30-12345678-9)",
        path: ["cuit"]
      });
    }
    
    if (!data.representante_legal || data.representante_legal.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El representante legal es obligatorio para solicitantes",
        path: ["representante_legal"]
      });
    }
    
    if (!data.domicilio || data.domicilio.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El domicilio es obligatorio para solicitantes",
        path: ["domicilio"]
      });
    }
  }
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Schemas específicos por rol
export const RegisterOperadorSchema = BaseCredentialsSchema.extend({}).strict();
export type RegisterOperadorSchemaType = z.infer<typeof RegisterOperadorSchema>;

export const RegisterSolicitanteSchema = BaseCredentialsSchema.extend({
  nombre_empresa: z.string()
    .min(2, 'El nombre de la empresa es obligatorio'),
  cuit: z.string()
    .regex(/^\d{2}-\d{8}-\d{1}$/, 'CUIT no válido (ej: 30-12345678-9)'),
  representante_legal: z.string()
    .min(2, 'El representante legal es obligatorio'),
  domicilio: z.string()
    .min(5, 'El domicilio es obligatorio'),
}).strict();
export type RegisterSolicitanteSchemaType = z.infer<typeof RegisterSolicitanteSchema>;

// Schema para recuperar contraseña
export const ForgotPasswordSchema = z.object({
  email: z.string()
    .min(1, 'El email es obligatorio')
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), 'Email no válido'),
});
export type ForgotPasswordSchemaType = z.infer<typeof ForgotPasswordSchema>;

// Mantener compatibilidad con código existente
export const LoginSchema = loginSchema;
export type LoginSchemaType = LoginInput;
export const desactivarCuentaSchema=z.object({
  password: z.string().min(1, 'La contraseña es requerida'),
  motivo: z.string().optional(),
});
export const emailRecuperacionSchema= z.object({
  email_recuperacion: z.string()
  .min(1, 'El email de recuperación es requerido')
  .email('Email de recuperación no válido'),
});
export type DesactivarCuentaInput= z.infer<typeof desactivarCuentaSchema>;
export type EmailRecuperacionInput= z.infer<typeof emailRecuperacionSchema>;