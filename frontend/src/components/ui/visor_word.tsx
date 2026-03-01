// frontend/src/components/ui/visor_word.tsx
export interface VisorWordFirmaProps {
    documento: Record<string, unknown>;
    onFirmaCompletada: (documentoFirmado: Record<string, unknown>) => void;
    modoFirma?: boolean;
    firmaId?: string;
}
