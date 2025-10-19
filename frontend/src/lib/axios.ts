// lib/axios.ts
import axios from "axios";
import { getSession } from "next-auth/react";
import mitt from "mitt";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// === EVENTO GLOBAL PARA SESIÓN EXPIRADA ===
export const sessionEmitter = mitt<{ expired: void }>();

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
  headers: { "Content-Type": "application/json" },
});

// === REQUEST INTERCEPTOR ===
axiosInstance.interceptors.request.use(
  async (config) => {
    const session = (await getSession()) as ExtendedSession;
    if (session?.accessToken) {
      config.headers["Authorization"] = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// === RESPONSE INTERCEPTOR ===
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const session = (await getSession()) as ExtendedSession;

        if (session?.refreshToken) {
          const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
            refresh_token: session.refreshToken,
          });

          if (refreshResponse.data.success) {
            const newToken = refreshResponse.data.data.access_token;
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          }
        }

        console.warn("⚠️ Token expirado → emitiendo evento de sesión vencida");
        sessionEmitter.emit("expired");
      } catch (e) {
        console.error("Error al refrescar token:", e);
        sessionEmitter.emit("expired");
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

// Helpers de conveniencia para tus requests
export const api = {
  get: (url: string, config?: any) => axiosInstance.get(url, config),
  post: (url: string, data?: any, config?: any) => axiosInstance.post(url, data, config),
  put: (url: string, data?: any, config?: any) => axiosInstance.put(url, data, config),
  delete: (url: string, config?: any) => axiosInstance.delete(url, config),
  patch: (url: string, data?: any, config?: any) => axiosInstance.patch(url, data, config),
};
