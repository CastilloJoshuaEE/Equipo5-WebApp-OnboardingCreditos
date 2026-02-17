// frontend/src/components/home/Advantages/Advantages.tsx
import Image from "next/image";
import styles from "./Advantages.module.css";

export default function Advantages() {
  const advantages = [
    {
      image: "/ilustraciones/sectionVentajasIllustration1.webp",
      title: "Evaluación Justa",
      description:
        "Analizamos cada caso de manera única, considerando el potencial real de tu negocio.",
    },
    {
      image: "/ilustraciones/sectionVentajasIllustration2.webp",
      title: "Respuesta Rápida",
      description:
        "Obtén una respuesta en menos de 24 horas, sin trámites innecesarios.",
    },
    {
      image: "/ilustraciones/sectionVentajasIllustration3.webp",
      title: "Sin Letra Pequeña",
      description:
        "Transparencia total en tasas, plazos y condiciones. Sin sorpresas desagradables.",
    },
    {
      image: "/ilustraciones/sectionVentajasIllustration4.webp",
      title: "Soporte Continuo",
      description:
        "Estamos contigo en cada paso, con un equipo dedicado a tu éxito.",
    },
  ];

  return (
    <section className={styles.advantages} id="advantages">
      <div className={styles.advantagesCenter}>
        <div className={styles.headlineAdvantages}>
          <h2>Nuestras Ventajas Competitivas</h2>
          <p>
            Lo que nos hace la opción preferida para la financiación de PYMES.
          </p>
        </div>
        <div className={styles.cardsGrid}>
          {advantages.map((advantage, index) => (
            <div key={index} className={styles.card}>
              <Image
                src={advantage.image}
                alt={advantage.title}
                width={200}
                height={150}
              />
              <div className={styles.text}>
                <h3>{advantage.title}</h3>
                <p>{advantage.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
