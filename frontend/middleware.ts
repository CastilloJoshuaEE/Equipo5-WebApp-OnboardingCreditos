import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from './src/types/auth.types';


const rolePermissions = {
  [UserRole.SOLICITANTE]: '/solicitante', 
  [UserRole.OPERADOR]: '/operador',
};

// Rutas que no necesitan autenticar
const publicRoutes = ['/', '/login', '/register', '/api/auth'];

export default withAuth(
  // Fx principal del middleware
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Si el usuario no tiene token o rol, pero intenta acceder a una ruta protegida
    if (!token && !publicRoutes.includes(pathname) && !pathname.startsWith('/api/auth')) {
      // Redirigir a login
      return NextResponse.redirect(new URL('/login', req.url));
    }

     
    if (token) {
      const userRole = token.rol as UserRole;
      const expectedBasePath = rolePermissions[userRole];

      
      if (pathname.startsWith('/solicitante') && userRole !== UserRole.SOLICITANTE) {
        return NextResponse.redirect(new URL(expectedBasePath + '/dashboard', req.url));
      }
      if (pathname.startsWith('/operador') && userRole !== UserRole.OPERADOR) {
        return NextResponse.redirect(new URL(expectedBasePath + '/dashboard', req.url));
      }
      
       
      if (pathname === '/login') {
        return NextResponse.redirect(new URL(expectedBasePath + '/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Si el usuario no esta logueado y no es ruta publica lleva a login, 
      
      authorized: ({ token, req }) => {
       
        if (publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
            return true;
        }
        // Permitir acceso si hay un token
        return !!token; 
      },
    },
    // Definimos la ruta de la API de NextAuth.js v4 (importante para que sepa dónde buscar)
    pages: {
        signIn: '/login',
    }
  }
);
