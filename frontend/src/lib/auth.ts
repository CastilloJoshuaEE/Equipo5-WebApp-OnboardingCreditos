import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { loginSchema } from '@/schemas/auth.schema';
import { authService } from '@/services/auth.service';

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
          if (!credentials) return null;
           
          const validCredentials = loginSchema.safeParse(credentials);
          if (!validCredentials.success) return null;

          
          const user = await authService.login(credentials);
          if (!user) return null;

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.nombre_completo,
            rol: user.rol
          };
        } catch (error) {
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    newUser: '/register',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.rol = user.rol;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.rol = token.rol;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // sesion expira en 24hs
  }
};