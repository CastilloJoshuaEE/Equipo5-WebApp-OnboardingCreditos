"use client";

import Image from "next/image";
import styles from "./Navbar.module.css";

export default function Navbar() {
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
            <button className={styles.btnPrimary}>Iniciar Sesión</button>
            <button className={styles.btnOutline}>Solicitar tu crédito</button>
          </div>
        </div>
      </div>
    </header>
  );
}
