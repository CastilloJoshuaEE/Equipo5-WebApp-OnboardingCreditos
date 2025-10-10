// frontend/src/schemas/solicitud.schema.ts
import { z } from 'zod';

export const solicitudCreditoSchema = z.object({
  monto: z.number()
    .min(50, 'El monto mínimo es $50')
    .max(10000000, 'El monto máximo es $10,000,000'),
  plazo_meses: z.number()
    .min(1, 'El plazo mínimo es 1 mes')
    .max(60, 'El plazo máximo es 60 meses'),
  moneda: z.enum(['ARS', 'USD']).default('ARS'),
  proposito: z.string()
    .min(10, 'El propósito debe tener al menos 10 caracteres')
    .max(500, 'El propósito no puede exceder 500 caracteres'),
});

export type SolicitudCreditoInput = z.infer<typeof solicitudCreditoSchema>;