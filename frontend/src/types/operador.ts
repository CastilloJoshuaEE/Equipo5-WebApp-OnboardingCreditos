// frontend/src/types/operador.ts
export interface SolicitudOperador {
    id: string;
    numero_solicitud: string;
    monto: number;
    plazo_meses: number;
    proposito?: string; // AÑADIR propiedad faltante
    moneda?: string; // AÑADIR propiedad faltante
    estado: string;
    nivel_riesgo: string;
    created_at: string;
    fecha_envio?: string; // AÑADIR propiedad opcional
    solicitantes: {
        nombre_empresa: string;
        cuit: string;
        representante_legal: string;
        domicilio?: string; // AÑADIR propiedad opcional
        usuarios: {
            nombre_completo: string;
            email: string;
            telefono: string;
        };
    };
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