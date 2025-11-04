"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserRole } from "@/types/auth.types";
import styles from "./HeroSection.module.css";

export default function HeroSection() {
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

  // Si está autenticado, mostrar botones de dashboard
  if (status === "authenticated") {
    return (
      <section className={styles.heroSection}>
        <div className={styles.heroCenter}>
          <div className={styles.heroContent}>
            <h1>
              Bienvenido de vuelta, <br />
              <span>{session.user.name}</span>
            </h1>
            <p>
              Continúa gestionando tus {session.user.rol === UserRole.SOLICITANTE ? 'solicitudes de crédito' : 'operaciones'} desde tu dashboard.
            </p>
            <div className={styles.heroButtons}>
              <button
                className={styles.btnPrimary}
                onClick={handleDashboard}
              >
                Ir al Dashboard
              </button>
              {session.user.rol === UserRole.SOLICITANTE && (
                <button
                  className={styles.btnOutline}
                  onClick={() => router.push('/solicitante#nueva-solicitud')}
                >
                  Nueva Solicitud
                </button>
              )}
            </div>
          </div>
          <div className={styles.heroImageContainer}>
            <Image
              className={styles.heroImage}
              src="/ilustraciones/heroSectionIllustration.webp"
              alt="Dashboard"
              width={500}
              height={400}
              priority
            />
          </div>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.statItem}>
            <strong>500+</strong>
            <span>Empresas Financiadas</span>
          </div>
          <div className={styles.statItem}>
            <strong>24h</strong>
            <span>Tiempo Promedio</span>
          </div>
          <div className={styles.statItem}>
            <strong>94%</strong>
            <span>Satisfacción</span>
          </div>
          <div className={styles.statItem}>
            <strong>$50M+</strong>
            <span>Desembolsados</span>
          </div>
        </div>
      </section>
    );
  }

  // Si no está autenticado, mostrar los botones normales
  return (
    <section className={styles.heroSection}>
              <div className={styles.heroImageContainer}>
          <Image
            className={styles.heroImage}
            src="/ilustraciones/heroSectionIllustration.webp"
            alt="Crédito Inteligente para PYMES"
            width={600}
            height={500}
            priority
          />
        </div>
        <div className={styles.heroCenter}>

        <div className={styles.heroContent}>
          <h1>
            Impulsa tu PYME con <span>Crédito Inteligente</span>
          </h1>
          <p>
            Acceso rápido y flexible a la financiación que tu negocio necesita
            para crecer. Soluciones diseñadas específicamente para el crecimiento
            de pequeñas y medianas empresas.
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
        
      </div>
      <div className={styles.heroStats}>
        <div className={styles.statItem}>
          <strong>500+</strong>
          <span>Empresas Financiadas</span>
        </div>
        <div className={styles.statItem}>
          <strong>24h</strong>
          <span>Tiempo Promedio</span>
        </div>
        <div className={styles.statItem}>
          <strong>94%</strong>
          <span>Satisfacción</span>
        </div>
        <div className={styles.statItem}>
          <strong>$50M+</strong>
          <span>Desembolsados</span>
        </div>
      </div>
    </section>
  );
}