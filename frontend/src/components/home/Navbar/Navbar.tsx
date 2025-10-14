"use client";

import Image from "next/image";
import styles from "./Navbar.module.css";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  const handleSolicitarCredito = () => {
    router.push("/"); // Ajusta la ruta si tu flujo de solicitud es distinto
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
          </div>
        </div>
      </div>
    </header>
  );
}
