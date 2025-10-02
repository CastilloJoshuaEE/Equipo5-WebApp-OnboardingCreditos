import NextAuth, { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { UserRole } from './auth.types';
 
declare module 'next-auth' {
  interface Session {
    user: {
      rol: UserRole;
      id: string;
    } & DefaultSession['user'];
  }

 
  interface User {
    rol: UserRole;
    id: string;
    token: string;
  }
}
 
declare module 'next-auth/jwt' {
  interface JWT {
    rol: UserRole;
    id: string;
    token: string;
  }
}
