// frontend/src/components/ui/contactoModalProps.tsx
import { ContactoBancario } from "@/features/contacto_bancario/contactoBancario.types";
export interface EditarContactoModalProps {
  open: boolean;
  onClose: () => void;
  contacto: ContactoBancario | null;
  onContactoActualizado: (contacto: ContactoBancario) => void;
}