import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.redirect(
        new URL('/login?error=token_o_email_faltante', request.url)
      );
    }

    // Llamar al backend con la nueva ruta
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(
      `${API_URL}/auth/recuperar-cuenta?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.redirected) {
      // Si el backend redirige, seguimos esa redirección
      const backendUrl = new URL(response.url);
      const message = backendUrl.searchParams.get('message');
      const error = backendUrl.searchParams.get('error');
      
      const frontendUrl = new URL('/login', request.url);
      if (message) frontendUrl.searchParams.set('message', message);
      if (error) frontendUrl.searchParams.set('error', error);
      
      return NextResponse.redirect(frontendUrl);
    }

    // Fallback si no hay redirección
    return NextResponse.redirect(new URL('/login?error=recuperacion_fallida', request.url));

  } catch (error) {
    console.error('Error en recuperación de cuenta:', error);
    return NextResponse.redirect(
      new URL('/login?error=error_servidor_recuperacion', request.url)
    );
  }
}