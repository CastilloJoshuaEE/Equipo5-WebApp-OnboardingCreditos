// frontend/src/features/usuario/perfil/usePerfilReturn.types.ts
import { PerfilUsuario } from "./perfil.types";
import { EditarPerfilInput } from "./perfil.forms";
import { PerfilCompleto } from "./perfil.types";
import { PerfilValidationErrors } from "./perfil.validation";

export interface UsePerfilReturn {
  perfil: PerfilCompleto | null;
  perfilBasico: PerfilUsuario | null;
  loading: boolean;
  error: string | null;
  cargarPerfil: () => Promise<void>;
  editarPerfil: (datos: EditarPerfilInput) => Promise<boolean>;
  validarPerfil: (datos: EditarPerfilInput) => PerfilValidationErrors;
}