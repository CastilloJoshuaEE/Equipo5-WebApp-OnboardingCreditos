// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import "./../styles/globals.css";

import { SessionProvider } from "@/providers/SessionProvider";
import { SessionExpiredProvider } from "@/providers/SessionExpiredProvider";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

export const metadata: Metadata = {
  title: "Sistema de Créditos PYME",
  description: "Plataforma integral para la gestión de créditos empresariales",
};

// Este layout debe ser un Server Component
// Movemos los providers que necesitan client-side a un componente separado
function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionExpiredProvider>
        {children}
        <ChatbotWidget />
      </SessionExpiredProvider>
    </SessionProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        style={{
          fontFamily: "Roboto, Arial, sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        {/* ThemeProvider y CssBaseline se manejarán en los componentes cliente */}
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}