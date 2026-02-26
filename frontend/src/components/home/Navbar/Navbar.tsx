// frontend/src/components/home/Navbar/Navbar.tsx
"use client";
import { useState } from "react";
import Image from "next/image";
import styles from "./Navbar.module.css";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { UserRole } from "@/features/auth/auth.types";
export default function Navbar() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const { data: session, status } = useSession();

const handleLogin = () => {
  setRedirecting(true);
  setTimeout(() => {
    router.push("/login");
  }, 800);
};
const handleSolicitarCredito = () => {
  setRedirecting(true);
  setTimeout(() => {
    router.push("/register");
  }, 800);
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
      {redirecting && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(255,255,255,0.4)",
      backdropFilter: "blur(4px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      flexDirection: "column",
    }}
  >
    <div className={styles.loader}></div>
    <p style={{ marginTop: "16px", fontWeight: 500 }}>
      Redirigiendo...
    </p>
  </div>
)}
    </header>
  );
}