// frontend/src/types/operador.ts
export interface SolicitudOperador {
    id: string;
    numero_solicitud: string;
    monto: number;
    plazo_meses: number;
    proposito?: string;
    moneda?: string;
    estado: string;
    nivel_riesgo: string;
    created_at: string;
    fecha_envio?: string;
    solicitantes: {
        nombre_empresa: string;
        cuit: string;
        representante_legal: string;
        domicilio?: string;
        usuarios: {
            nombre_completo: string;
            email: string;
            telefono: string;
            dni?: string;
        };
    };
    // NUEVA PROPIEDAD para información de contacto fácil
    solicitante_info?: {
        nombre_empresa: string;
        cuit: string;
        representante_legal: string;
        domicilio: string;
        contacto: string;
        email: string;
        telefono: string;
        dni: string;
    };
    transferencias_bancarias?: TransferenciaBancaria[];
    contratos?: Contrato[];
}
export interface TransferenciaBancaria {
    id: string;
    solicitud_id: string;
    contrato_id: string;
    contacto_bancario_id: string;
    monto: number;
    moneda: string;
    numero_comprobante?: string;
    cuenta_origen: string;
    banco_origen: string;
    cuenta_destino: string;
    banco_destino: string;
    motivo?: string;
    costo_transferencia: number;
    estado: 'pendiente' | 'procesando' | 'completada' | 'fallida' | 'reversada';
    procesado_por?: string;
    fecha_procesamiento?: string;
    fecha_completada?: string;
    ruta_comprobante?: string;
    created_at: string;
    updated_at: string;
}

// ✅ NUEVA INTERFACE: Contrato
export interface Contrato {
    id: string;
    solicitud_id: string;
    numero_contrato: string;
    monto_aprobado: number;
    tasa_interes: number;
    plazo_meses: number;
    estado: 'generado' | 'firmado_solicitante' | 'firmado_completo' | 'vigente' | 'cerrado';
    ruta_documento?: string;
    firma_digital_id?: string;
    hash_contrato?: string;
    fecha_firma_solicitante?: string;
    fecha_firma_entidad?: string;
    fecha_firma_completa?: string;
    created_at: string;
    updated_at: string;
}
export interface MetricasDashboard {
    totalSolicitudes: number;
    aprobadas: number;
    enRevision: number;
    montoDesembolsado: number;
    listasParaTransferencia?: number;
}
export interface Documento {
    id: string;
    tipo: string;
    nombre_archivo: string;
    ruta_storage: string;
    tamanio_bytes: number;
    estado: string;
    created_at: string;
    validado_en?: string;
    comentarios?: string;
    informacion_extraida?: any;
}

export interface Scoring {
    total: number;
    desglose: {
        [key: string]: {
            puntaje: number;
            estado: string;
            documento_id?: string;
            nombre_archivo?: string;
        };
    };
    documentosFaltantes: string[];
    documentosValidados: number;
    documentosPendientes: number;
}

export interface InfoBCRA {
    denominacion: string;
    totalDeudas: number;
    montoTotal: number;
    situacionPromedio: string;
    entidades: Array<{
        nombre: string;
        situacionDesc: string;
        monto: number;
        diasAtraso: number | null;
    }>;
    error?: boolean;
    mensaje?: string;
    success?: boolean;
    procesado?: any;
    consulta?: string;
    sinSSL?: boolean;
}

export interface RevisionData {
    solicitud: SolicitudOperador;
    documentos: Documento[];
    infoBCRA: any;
    scoring: any;
    solicitante: any;
}

export interface FiltrosOperador {
    estado?: string;
    nivel_riesgo?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    numero_solicitud?: string;
    dni?: string;
}