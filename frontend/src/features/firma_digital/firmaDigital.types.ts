// frontend/src/features/firma_digital/firmaDigital.types.ts
export interface FirmaDigital {
  id: string;
  estado: string;
  fecha_firma_completa: string;
  url_documento_firmado: string;
  ruta_documento: string;
  integridad_valida: boolean;
}

export interface VerificacionFirma {
  habilitado: boolean;
  motivo: string;
  estado_firma: string;
  detalles?: any;
}

export interface InfoFirmaData {
    firma: {
        id: string;
        solicitudes_credito: {
            numero_solicitud: string;
            solicitante_id: string;
            operador_id: string;
        };
        estado: string;
        fecha_expiracion: string;
    };
    fecha_expiracion: string;
    documento: any;
    nombre_documento: string;
    tipo_documento: string;
    solicitante: any;
    hash_original: string;
}

export interface FirmaData {
    firma: {
        id: string;
        estado: string;
        fecha_envio: string;
        fecha_expiracion: string;
        fecha_firma_solicitante?: string;
        fecha_firma_operador?: string;
        fecha_firma_completa?: string;
        url_firma_solicitante?: string;
        url_firma_operador?: string;
        url_documento_firmado?: string;
        integridad_valida?: boolean;
    };
}