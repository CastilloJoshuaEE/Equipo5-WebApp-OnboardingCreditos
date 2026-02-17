// frontend/src/components/ui/eliminarCuentaModalProps.tsx
export interface EliminarCuentaModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}
