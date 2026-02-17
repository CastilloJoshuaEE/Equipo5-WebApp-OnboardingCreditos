// frontend/src/components/home/Navbar/Navbar.tsx
"use client";

import Image from "next/image";
import styles from "./Navbar.module.css";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { UserRole } from "@/features/auth/auth.types";
export default function Navbar() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleLogin = () => {
    router.push("/login");
  };

  const handleSolicitarCredito = () => {
    router.push('/register');
  };

  const handleDashboard = () => {
    if (session?.user?.rol === UserRole.SOLICITANTE) {
      router.push('/solicitante');
    } else if (session?.user?.rol === UserRole.OPERADOR) {
      router.push('/operador');
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.navCenter}>
        <a href="#">
          <Image
            className={styles.logo}
            src="/logos/logoVariant3.svg"
            alt="LogoNexia"
            width={120}
            height={40}
            priority
          />
        </a>
        <div className={styles.navUnion}>
          <nav>
            <ul>
              <li>
                <a href="#services">Servicios</a>
              </li>
              <li>
                <a href="#benefits">Beneficios</a>
              </li>
              <li>
                <a href="#advantages">Ventajas</a>
              </li>
              <li>
                <a href="#contacts">Contacto</a>
              </li>
            </ul>
          </nav>
          <div className={styles.navButtons}>
            {status === "authenticated" ? (
              <>
                <button
                  className={styles.btnPrimary}
                  onClick={handleDashboard}
                >
                  Mi Dashboard
                </button>
                <button
                  className={styles.btnOutline}
                  onClick={handleLogout}
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <button
                  className={styles.btnPrimary}
                  onClick={handleLogin}
                >
                  Iniciar Sesión
                </button>
                <button
                  className={styles.btnOutline}
                  onClick={handleSolicitarCredito}
                >
                  Solicita tu Crédito
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}