import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                    request.nextUrl.pathname.startsWith('/register')


  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && isAuthPage) {
    const dashboardPath = token.rol === 'solicitante' ? '/dashboard/solicitante' : '/dashboard/operador'
    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }


  if (token) {
    const isSolicitantePath = request.nextUrl.pathname.startsWith('/dashboard/solicitante')
    const isOperadorPath = request.nextUrl.pathname.startsWith('/dashboard/operador')

    if (isSolicitantePath && token.rol !== 'solicitante') {
      return NextResponse.redirect(new URL('/dashboard/operador', request.url))
    }

    if (isOperadorPath && token.rol !== 'operador') {
      return NextResponse.redirect(new URL('/dashboard/solicitante', request.url))
    }
  }

  return NextResponse.next()
}
//rutas protegidas
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register']
}
