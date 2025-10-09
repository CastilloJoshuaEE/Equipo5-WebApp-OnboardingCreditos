import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/error?message=Token no proporcionado', request.url)
      );
    }

    // Llamar al backend para confirmar el email
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const response = await fetch(`${API_URL}/auth/confirmar?token=${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      // Redirigir a página de éxito
      return NextResponse.redirect(new URL('/confirmacion-exitosa', request.url));
    } else {
      const errorData = await response.json();
      return NextResponse.redirect(
        new URL(`/error?message=${encodeURIComponent(errorData.message || 'Error en la confirmación')}`, request.url)
      );
    }
  } catch (error) {
    console.error('Error en confirmación:', error);
    return NextResponse.redirect(
      new URL('/error?message=Error en el servidor durante la confirmación', request.url)
    );
  }
}