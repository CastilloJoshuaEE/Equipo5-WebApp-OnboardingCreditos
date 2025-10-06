import { DefaultSession } from 'next-auth';
import { UserRole } from './auth.types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      rol: UserRole;
      email_confirmado: boolean;
    } & DefaultSession['user']
  }

  interface User {
    id: number;
    rol: UserRole;
    email_confirmado: boolean;
    nombre_completo: string;
    dni: string;
    telefono: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: number;
    rol: UserRole;
    email_confirmado: boolean;
  }
}
