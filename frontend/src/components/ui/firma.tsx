// frontend/src/components/ui/firma.tsx
export interface PosicionFirma {
    x: number;
    y: number;
    pagina: number;
}
export interface Firma {
    id: string;
    tipoFirma: string;
    firmaTexto?: string;
    firmaImagen?: string;
    estilo?: string;
    posicion: PosicionFirma;
    fecha: string;
    tamaño: { width: number; height: number };
    isDragging?: boolean;
}

export interface EditorFirmaProps {
    open: boolean;
    onClose: () => void;
    onFirmaGuardada: (firmaData: any) => void;
}

export interface FirmaDigitalStatusProps {
    firmaId: string;
    solicitudId: string;
}

export interface BotonIniciarFirmaProps {
  solicitudId: string;
  onFirmaIniciada: (data: any) => void;
}