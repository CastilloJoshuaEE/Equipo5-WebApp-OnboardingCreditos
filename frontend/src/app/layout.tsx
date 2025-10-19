import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./../styles/globals.css";
import { SessionProvider } from "@/providers/SessionProvider";
import { SessionExpiredProvider } from '@/providers/SessionExpiredProvider';

const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--fontFamily",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nexia - Plataforma de créditos para PYMES",
  description:
    "Acceso rápido y flexible a la financiación que tu negocio necesita para crecer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SessionProvider>
          <SessionExpiredProvider>
            {children}
          </SessionExpiredProvider>
        </SessionProvider>
      </body>
    </html>
  );
}