// frontend/src/lib/axios.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';
import mitt from 'mitt';
import { InternalAxiosRequestConfig } from 'axios';

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
const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    // Manejo de error 401 - No autorizado
    if (error.response?.status === 401) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const session = (await getSession()) as ExtendedSession;
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
      sessionEmitter.emit('expired');
      setTimeout(async () => {
        await signOut({ callbackUrl: '/login', redirect: true });
      }, 2000);
    }

    // Manejo de error 403 - Acceso denegado
    if (error.response?.status === 403) {
      sessionEmitter.emit('unauthorized');
    }

    //   Manejar el error "Unexpected token 'T'" o "Too Many Requests"
    if (
      error.message?.includes("Unexpected token 'T'") ||
      error.message?.includes("Too Many Requests")
    ) {
      alert(". ESPERE UNOS MINUTOS MIENTRAS EL SERVIDOR SE ACTIVA Y RECARGUE LA PÁGINA...");
    }

    return Promise.reject(error);
  }
);


export default axiosInstance;

// Helpers de conveniencia para tus requests (del segundo código)
export const api = {
get: <T = unknown>(url: string, config?: AxiosRequestConfig) => axiosInstance.get<T>(url, config),
post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => axiosInstance.post<T>(url, data, config),  
put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => axiosInstance.put<T>(url, data, config),
 
delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => axiosInstance.delete<T>(url, config),

patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => axiosInstance.patch<T>(url, data, config),
};