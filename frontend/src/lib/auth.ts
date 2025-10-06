import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { loginSchema } from '@/schemas/auth.schema';
import { AuthService } from '@/services/auth.service';

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
          
          // Validar credenciales
          const validCredentials = loginSchema.safeParse(credentials);
          if (!validCredentials.success) return null;

          // Autenticar usuario - AuthService.login retorna AuthResponse
          const authResponse = await AuthService.login(credentials);
          if (!authResponse || !authResponse.user) return null;

          // Extraer el usuario del response
          const { user } = authResponse;

          return {
            id: user.id,
            email: user.email,
            name: user.nombre_completo,
            rol: user.rol,
            email_confirmado: user.email_confirmado,
            nombre_completo: user.nombre_completo,
            dni: user.dni,
            telefono: user.telefono
          };
        } catch (error) {
          console.error('Error en authorize:', error);
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
        token.id = parseInt(user.id as string);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.rol = token.rol;
        session.user.id = token.id as number;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // sesión expira en 24hs
  },
  secret: process.env.NEXTAUTH_SECRET,
};