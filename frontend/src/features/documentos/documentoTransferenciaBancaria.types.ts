// frontend/src/features/documentos/documentoTransferenciaBancaria.types.ts
export interface DocumentoTransferenciaBancaria {
  id: string;
  solicitud_id: string;
  contrato_id: string;
  contacto_bancario_id: string;
  monto: string;
  moneda: string;
  numero_comprobante: string;
  cuenta_origen: string;
  banco_origen: string;
  cuenta_destino: string;
  banco_destino: string;
  motivo: string;
  costo_transferencia: string;
  estado: string;
  procesado_por: string;
  fecha_procesamiento: string;
  fecha_completada: string;
  ruta_comprobante: string;
  created_at: string;
  updated_at: string;
  solicitudes_credito?: {
    numero_solicitud: string;
    solicitante_id: string;
  };
  contactos_bancarios?: {
    nombre_banco: string;
    numero_cuenta: string;
    tipo_cuenta: string;
  };
}
