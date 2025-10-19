<<<<<<< HEAD
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
=======
import type { Metadata } from "next"; 
>>>>>>> origin/dev-estilosloginregister404
import "./../styles/globals.css";
import { SessionProvider } from "@/providers/SessionProvider";
import { SessionExpiredProvider } from '@/providers/SessionExpiredProvider';

<<<<<<< HEAD
const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--fontFamily",
  display: "swap",
});
=======
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

>>>>>>> origin/dev-estilosloginregister404

export const metadata: Metadata = {
  title: "Nexia - Plataforma de créditos para PYMES",
  description:
    "Acceso rápido y flexible a la financiación que tu negocio necesita para crecer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
<<<<<<< HEAD
      <body>
        <SessionProvider>
          <SessionExpiredProvider>
            {children}
          </SessionExpiredProvider>
        </SessionProvider>
=======
      <body 
      style={{
          fontFamily: "Roboto, Arial, sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        <SessionProvider>{children}</SessionProvider>
>>>>>>> origin/dev-estilosloginregister404
      </body>
    </html>
  );
}