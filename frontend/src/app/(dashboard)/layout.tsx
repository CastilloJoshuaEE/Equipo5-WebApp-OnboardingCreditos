'use client';

import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/styles/theme';
//castellano
const inter = Inter({ subsets: ['latin'] });

interface RootLayoutProps {children: React.ReactNode;}



export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>

  );
}
//metas 
export const metadata = {
  title: 'Sistema de Créditos PYME',
  description: 'Plataforma de gestión de créditos para PYMES',
  icons: { icon: '/favicon.ico'     },
};