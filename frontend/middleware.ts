// frontend/middleware.ts
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                    request.nextUrl.pathname.startsWith('/register')

  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')

  // Redirigir a login si no está autenticado y quiere acceder al dashboard
  if (!token && isDashboardPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirigir al dashboard si está autenticado y quiere acceder a login/register
  if (token && isAuthPage) {
    const dashboardPath = token.rol === 'solicitante' ? '/dashboard/solicitante' : '/dashboard/operador'
    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }

  // Protección de rutas de dashboard por rol
  if (token && isDashboardPage) {
    const isSolicitantePath = request.nextUrl.pathname.startsWith('/dashboard/solicitante')
    const isOperadorPath = request.nextUrl.pathname.startsWith('/dashboard/operador')

    if (isSolicitantePath && token.rol !== 'solicitante') {
      return NextResponse.redirect(new URL('/operador', request.url))
    }

    if (isOperadorPath && token.rol !== 'operador') {
      return NextResponse.redirect(new URL('/solicitante', request.url))
    }
  }

  return NextResponse.next()
}

// Rutas protegidas
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/login', 
    '/register',
    '/api/auth/session'
  ]
}