// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth';
import { UserRole } from './auth.types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      rol: UserRole;
      email_confirmado: boolean;
      nombre_completo?: string;
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    id: string;
    rol: UserRole;
    email_confirmado: boolean;
    nombre_completo?: string;
    dni?: string;
    telefono?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    rol: UserRole;
    email_confirmado: boolean;
    nombre_completo?: string;
  }
}