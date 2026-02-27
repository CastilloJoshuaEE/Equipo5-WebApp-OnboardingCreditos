// frontend/src/shared/hooks/useBackendHealth.ts
import { useState, useEffect, useCallback } from 'react';

interface HealthStatus {
  status: 'checking' | 'ok' | 'error';
  message?: string;
}

export function useBackendHealth() {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'checking'
  });

  const checkHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health?ts=${Date.now()}`, {
        signal: controller.signal,
        cache: 'no-store'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setHealth({
          status: 'ok',
          message: 'Backend conectado'
        });
        return true;
      } else {
        throw new Error('Backend no responde correctamente');
      }
    } catch (error) {
      console.error('Error verificando health:', error);
      setHealth({
        status: 'error',
        message: error instanceof Error ? error.message : 'Error de conexión'
      });
      return false;
    }
  }, []);

  // Verificar inmediatamente y luego cada 30 segundos
  useEffect(() => {
    checkHealth();

    const interval = setInterval(checkHealth, 30000);

    // Re-verificar cuando la ventana recupera el foco
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkHealth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkHealth]);

  const waitForBackend = useCallback(async (maxAttempts = 12): Promise<boolean> => {
    // Si ya está OK, retornar inmediatamente
    if (health.status === 'ok') return true;

    // Intentar verificar varias veces
    for (let i = 0; i < maxAttempts; i++) {
      const isOk = await checkHealth();
      if (isOk) return true;
      
      // Esperar 2.5 segundos entre intentos
      await new Promise(resolve => setTimeout(resolve, 2500));
    }

    return false;
  }, [health.status, checkHealth]);

  return {
    health,
    checkHealth,
    waitForBackend,
    isReady: health.status === 'ok',
    isChecking: health.status === 'checking',
    isError: health.status === 'error'
  };
}