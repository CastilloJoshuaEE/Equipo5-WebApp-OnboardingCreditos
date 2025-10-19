"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import styles from "./HeroSection.module.css";

export default function HeroSection() {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  const handleSolicitarCredito = () => {
    router.push('/register')};


  return (
    <section className={styles.heroSection}>
      <div className={styles.heroCenter}>
        <div className={styles.heroContent}>
          <h1>
            Impulsa tu PYME con <span>Crédito Inteligente</span>
          </h1>
          <p>
            Acceso rápido y flexible a la financiación que tu negocio necesita
            para crecer.
          </p>
          <div className={styles.heroButtons}>
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
        <Image
          className={styles.heroImage}
          src="/ilustraciones/heroSectionIllustration.webp"
          alt="Crédito Inteligente"
          width={600}
          height={500}
          priority
        />
      </div>
      <div className={styles.heroStats}>
        <p>
          <strong>500+</strong>
          <span> Empresas Financiadas</span>
        </p>
        <p>
          <strong>24h</strong>
          <span> Tiempo Promedio</span>
        </p>
        <p>
          <strong>94%</strong>
          <span> Satisfacción</span>
        </p>
        <p>
          <strong>$50M+</strong>
          <span> Desembolsados</span>
        </p>
      </div>
    </section>
  );
}
