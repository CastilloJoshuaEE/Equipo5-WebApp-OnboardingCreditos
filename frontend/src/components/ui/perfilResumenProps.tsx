// frontend/src/components/ui/perfilResumenProps.tsx
import { PerfilCompleto } from "@/features/usuario/perfil/perfil.types";
export interface PerfilResumenProps {
  perfil: PerfilCompleto | null;
  onClick?: () => void;
}