// frontend/src/types/operador.ts
export interface SolicitudOperador {
    id: string;
    numero_solicitud: string;
    monto: number;
    plazo_meses: number;
    estado: string;
    nivel_riesgo: string;
    created_at: string;
    solicitantes: {
        nombre_empresa: string;
        cuit: string;
        representante_legal: string;
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
    ruta_storage: string; // AÑADIR ESTA PROPIEDAD
    tamanio_bytes: number; // AÑADIR ESTA PROPIEDAD
    estado: string;
    created_at: string; // CAMBIAR de fecha_subida a created_at
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
    scoring: Scoring;
    infoBCRA: InfoBCRA | null;
}

export interface FiltrosOperador {
    estado: string;
    nivel_riesgo: string;
    fecha_desde: string;
    fecha_hasta: string;
}