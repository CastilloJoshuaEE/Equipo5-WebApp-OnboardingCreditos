// frontend/src/components/ui/visor_word.tsx
export interface VisorWordFirmaProps {
    documento: any;
    onFirmaCompletada: (documentoFirmado: any) => void;
    modoFirma?: boolean;
    firmaId?: string;
}
