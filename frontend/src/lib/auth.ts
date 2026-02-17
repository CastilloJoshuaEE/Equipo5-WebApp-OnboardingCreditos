// frontend/src/lib/auth.ts
import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Extender tipos de NextAuth
declare module 'next-auth' {
  interface User {
    rol: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    supabaseUserId?: string;
  }

  interface Session {
    user: {
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
  }

  interface JWT {
    rol?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    supabaseUserId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    rol: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    supabaseUserId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email y contraseña son requeridos');
          }

          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          
          console.log('. NextAuth llamando a backend...');
          const response = await fetch(`${API_URL}/usuarios/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            }),
          });

          const data = await response.json();
          
          if (!data.success) {
            console.error('. Error del backend:', data.message);
            throw new Error(data.message || 'Error en autenticación');
          }

          // . ESTRUCTURA . - Incluir tokens de Supabase
          if (data.data?.profile && data.data?.session) {
            const user = data.data.profile;
            const session = data.data.session;
            
            return {
              id: user.id,
              email: user.email,
              name: user.nombre_completo,
              rol: user.rol,
              // . TOKENS DE SUPABASE CRÍTICOS
              accessToken: session.access_token,
              refreshToken: session.refresh_token,
              expiresAt: session.expires_at,
              supabaseUserId: session.user?.id
            } as User;
          }
          
          throw new Error('Estructura de respuesta inválida');
        } catch (error) {
          console.error('. Authorize error:', error);
          // . .: Usar type guard en lugar de 'any'
          if (error instanceof Error) {
            throw new Error(error.message || 'Error de autenticación');
          } else {
            throw new Error('Error de autenticación desconocido');
          }
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    // .: 'signUp' no existe, usar 'newUser' en su lugar
    newUser: '/register',
    error: '/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      // . PERSISTIR TOKENS DE SUPABASE EN JWT
      if (user) {
        token.rol = user.rol;
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.expiresAt = user.expiresAt;
        token.supabaseUserId = user.supabaseUserId;
      }

      // . Verificar si el token está por expirar
      if (token.expiresAt && typeof token.expiresAt === 'number') {
        const expiresAtMs = token.expiresAt * 1000;
        if (Date.now() > expiresAtMs - 60000) {
          console.log('. Token cerca de expirar, necesitaría refresh...');
        }
      }

      return token;
    },
    async session({ session, token }) {
      // . HACER TOKENS DISPONIBLES EN FRONTEND
      if (session.user) {
        session.user.rol = token.rol as string;
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.expiresAt = token.expiresAt as number;
        session.supabaseUserId = token.supabaseUserId as string;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 horas
  },
  secret: process.env.NEXTAUTH_SECRET,
};