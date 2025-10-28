// frontend/src/lib/axios.ts
import axios, { AxiosError } from 'axios';
import { getSession, signOut } from 'next-auth/react';
import mitt from 'mitt';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// === EVENTO GLOBAL PARA SESIÓN EXPIRADA ===
export const sessionEmitter = mitt<{ 
  expired: void; 
  unauthorized: void;
}>();

interface ExtendedSession {
  user?: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    rol?: string;
  };
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  supabaseUserId?: string;
  expires?: string;
}

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// === REQUEST INTERCEPTOR ===
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const session = (await getSession()) as ExtendedSession;
      
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
        
        // Verificar si el token está cerca de expirar (mejora del primer código)
        try {
          const payload = JSON.parse(atob(session.accessToken.split('.')[1]));
          const exp = payload.exp * 1000;
          const now = Date.now();
          const timeUntilExpiry = exp - now;
          
          // Si el token expira en menos de 5 minutos, mostrar advertencia
          if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
            console.log('Token cerca de expirar, intentando refresh...');
            
            // Intentar refresh automático si tenemos refreshToken
            if (session?.refreshToken) {
              try {
                const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
                  refresh_token: session.refreshToken,
                });

                if (refreshResponse.data.success) {
                  const newToken = refreshResponse.data.data.access_token;
                  config.headers.Authorization = `Bearer ${newToken}`;
                  console.log('Token refrescado automáticamente');
                }
              } catch (refreshError) {
                console.error('Error al refrescar token:', refreshError);
              }
            }
          }
        } catch (e) {
          console.error('Error verificando expiración del token:', e);
        }
      }
      
      return config;
    } catch (error) {
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// === RESPONSE INTERCEPTOR ===
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Manejo de error 401 - No autorizado
    if (error.response?.status === 401) {
      console.log('Error 401 - No autorizado');
      
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const session = (await getSession()) as ExtendedSession;

          // Intentar refresh del token si tenemos refreshToken
          if (session?.refreshToken) {
            const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
              refresh_token: session.refreshToken,
            });

            if (refreshResponse.data.success) {
              const newToken = refreshResponse.data.data.access_token;
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return axiosInstance(originalRequest);
            }
          }
        } catch (refreshError) {
          console.error('Error al refrescar token:', refreshError);
        }
      }

      // Emitir evento de sesión expirada
      sessionEmitter.emit('expired');
      
      // Forzar logout después de un tiempo si no se ha hecho
      setTimeout(async () => {
        await signOut({ 
          callbackUrl: '/login',
          redirect: true 
        });
      }, 2000);
    }
    
    // Manejo de error 403 - Acceso denegado
    if (error.response?.status === 403) {
      console.log('Error 403 - Acceso denegado');
      sessionEmitter.emit('unauthorized');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

// Helpers de conveniencia para tus requests (del segundo código)
export const api = {
  get: (url: string, config?: any) => axiosInstance.get(url, config),
  post: (url: string, data?: any, config?: any) => axiosInstance.post(url, data, config),
  put: (url: string, data?: any, config?: any) => axiosInstance.put(url, data, config),
  delete: (url: string, config?: any) => axiosInstance.delete(url, config),
  patch: (url: string, data?: any, config?: any) => axiosInstance.patch(url, data, config),
};