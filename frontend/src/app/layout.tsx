import type { Metadata } from "next"; 
import "./../styles/globals.css";
import { SessionProvider } from "@/providers/SessionProvider";

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';


export const metadata: Metadata = {
  title: "Sistema de Créditos PYME",
  description: "Plataforma integral para la gestión de créditos empresariales",
};

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
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
