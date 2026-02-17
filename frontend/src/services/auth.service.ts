// frontend/src/services/auth.service.ts
import api from '../lib/axios';
import { AuthResponse } from '@/features/auth/auth.response';
import { LoginCredentials } from '@/features/auth/login.types';
import { RegisterSolicitante } from '@/features/auth/register.types';
import { RegisterOperador } from '@/features/auth/register.types';
import { AuthUser } from '@/features/auth/auth.types';
export const AuthService = {
  register: async (data: RegisterSolicitante | RegisterOperador) => {
    return api.post<void>('/api/usuarios/registro', data);
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/api/usuarios/login', credentials);
    return response.data;
  },
  forgotPassword: async (email: string) => {
    return api.post<void>('/api/usuarios/restablecer-cuenta', { email });
  },

  getSession: async () => {
    return api.get('/api/usuarios/session');
  },

  getProfile: async () => {
    return api.get<AuthUser>('/api/usuario/perfil');
  },

  updateProfile: async (data: Partial<AuthUser>) => {
    return api.put('/api/usuario/editar-perfil', data);
  },

  logout: async () => {
    return api.post('/api/usuarios/logout');
  },

  verifyEmail: async (email: string) => {
    return api.post('/api/usuarios/verificar-email', { email });
  },
};