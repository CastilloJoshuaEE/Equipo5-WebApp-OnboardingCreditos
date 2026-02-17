// frontend/src/components/ui/desactivarCuentaModalProps.tsx
export interface DesactivarCuentaModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string, motivo?: string) => Promise<void>;
}
