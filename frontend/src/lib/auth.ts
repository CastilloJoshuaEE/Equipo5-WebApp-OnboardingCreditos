 
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { AuthService } from '../services/auth.service';
import { LoginCredentials, UserRole } from '../types/auth.types'; 
 
export const authOptions: NextAuthOptions = { 
    session: {
        strategy: 'jwt',
    },
    
    
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {                 
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
                         
            async authorize(credentials, _req) { 
                
                const creds = credentials as LoginCredentials; 

                if (!creds || !creds.email || !creds.password) return null;

                try {
             
                    const authData = await AuthService.login(creds);
                    if (authData && authData.user) {
                        return {
                            id: authData.user.id,
                            email: authData.user.email,
                            rol: authData.user.rol,                
                            name: authData.user.nombre_completo,                              
                            token: authData.access_token,
                        }; 
                    }
                } catch (error) {
                    console.error('Error de autenticación:', error);
                    return null;  
                }
                return null;
            }
        })
    ],
    
    // Callbacks para gestionar la sesión y el token JWT
    callbacks: {
         
        async jwt({ token, user }) {
         
            if (user) {
                token.id = user.id;
                token.rol = user.rol;
            }
            return token;
        },

        async session({ session, token }) {
       
            if (session.user && token.id && token.rol) {
                session.user.id = token.id;
                session.user.rol = token.rol as UserRole;
            }
            return session;
        },
    },
    
     
    secret: process.env.NEXTAUTH_SECRET,
};