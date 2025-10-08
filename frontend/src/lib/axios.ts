// lib/axios.ts - .
import axios from 'axios';
import { getSession } from 'next-auth/react';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Extender el tipo de Session para incluir nuestras propiedades personalizadas
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

axiosInstance.interceptors.request.use(
  async (config) => {
    const session = await getSession() as ExtendedSession;

    // . USAR TOKEN DE SUPABASE
    if (session?.accessToken) {
      config.headers['Authorization'] = `Bearer ${session.accessToken}`;
      console.log('. Axios: Usando token Supabase para request');
    } else {
      console.warn('. Axios: Sin token de Supabase disponible');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('. Axios: Token expirado, intentando refresh...');
        const session = await getSession() as ExtendedSession;
        
        if (session?.refreshToken) {
          // Llamar a endpoint de refresh en tu backend
          const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
            refresh_token: session.refreshToken
          });

          if (refreshResponse.data.success) {
            const newToken = refreshResponse.data.data.access_token;
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            console.log('. Token refrescado exitosamente');
            
            return axiosInstance(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('. Error refreshing token:', refreshError);
        // Forzar logout
        if (typeof window !== 'undefined') {
          window.location.href = '/login?error=session_expired';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;