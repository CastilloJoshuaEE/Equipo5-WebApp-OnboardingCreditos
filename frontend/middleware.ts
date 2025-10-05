import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';




export default withAuth(
  // Fx principal del middleware
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
if (path === '/' || path.startsWith('/(auth')){
  return NextResponse.next();
}
     //sin token ir al login
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

  const userRole = token.rol ;

    
      if (path.startsWith('/dashboard/solicitante') ){
        if(userRole !== 'solicitante'){
          return NextResponse.redirect(new URL('/404', req.url));
        }
      }
        

      if (path.startsWith('/dashboard/operador') ){
        if(userRole !== 'operador'){
          return NextResponse.redirect(new URL('/404', req.url));
        }
      }

      return NextResponse.next();
    },
    {//permitir acceso si hay token
      callbacks: {authorized:({token}) => !!token,},
      
    } );

    export const config = {
      matcher: ['/dashboard/:path*'],
    };
