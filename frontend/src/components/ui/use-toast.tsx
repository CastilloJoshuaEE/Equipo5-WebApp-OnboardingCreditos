import { useState } from 'react';

interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (toastData: Toast) => {
    setToasts(prev => [...prev, toastData]);
    // Simular el comportamiento de toast
    console.log('Toast:', toastData);
    
    // En un entorno real, aquí integrarías con tu sistema de notificaciones
    if (toastData.variant === 'destructive') {
      console.error(toastData.title, toastData.description);
    } else {
      console.log(toastData.title, toastData.description);
    }
  };

  return { toast };
}