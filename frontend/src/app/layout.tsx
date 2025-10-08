import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./../styles/globals.css";
import { SessionProvider } from "@/providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
