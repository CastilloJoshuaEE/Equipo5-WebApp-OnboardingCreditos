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

    // CORRECCIÓN: Llamar al backend con la URL correcta
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(
      `${API_URL}/auth/confirmar?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      // Redirigir a página de éxito
      return NextResponse.redirect(new URL('/login?message=email_confirmado', request.url));
    } else {
      const errorData = await response.json();
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorData.message || 'Error en la confirmación')}`, request.url)
      );
    }
  } catch (error) {
    console.error('Error en confirmación:', error);
    return NextResponse.redirect(
      new URL('/login?error=error_servidor_confirmacion', request.url)
    );
  }
}