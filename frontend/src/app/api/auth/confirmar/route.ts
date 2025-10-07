import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/error?message=Token no proporcionado', request.url));
    }

    // Redirigir a la página de confirmación
    const confirmUrl = new URL('/confirmacion', request.url);
    confirmUrl.searchParams.set('token', token);

    return NextResponse.redirect(confirmUrl);
  } catch (error) {
    console.error('Error en confirmación:', error);
    return NextResponse.redirect(new URL('/error?message=Error en la confirmación', request.url));
  }
}