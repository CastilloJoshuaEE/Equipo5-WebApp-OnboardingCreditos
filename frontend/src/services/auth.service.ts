import api from '../lib/axios';
import { AuthResponse, LoginCredentials, RegisterSolicitante, RegisterOperador, AuthUser } from '../types/auth.types';


const AUTH_URL = 'api/usuarios';

// Centraliza todas las llamadas POST de registro/login
export const AuthService = {
  // POST /api/usuarios/registro
  register: async (data: RegisterSolicitante | RegisterOperador) => {
     
    return api.post<void>(`${AUTH_URL}/registro`, data);
  },

  // POST /api/usuarios/login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(`${AUTH_URL}/login`, credentials);
    
 
    return response.data;
  },

  // POST /api/usuarios/recuperacion?
  forgotPassword: async (email: string) => {
    return api.post<void>(`${AUTH_URL}/recuperacion`, { email });
  },

// GET /api/usuarios/session
  getSession: async () => {
    return api.get(`${AUTH_URL}/session`);
  },

  // GET /api/usuario/perfil
  getProfile: async () => {
    return api.get<AuthUser>('/api/usuario/perfil');
  },

  // PUT /api/usuario/perfil
  updateProfile: async (data: Partial<AuthUser>) => {
    return api.put('/api/usuario/perfil', data);
  },

  // POST /api/usuarios/logout
  logout: async () => {
    return api.post(`${AUTH_URL}/logout`);
  },

  // POST /api/usuarios/verificar-email
  verifyEmail: async (email: string) => {
    return api.post(`${AUTH_URL}/verificar-email`, { email });
  },
};