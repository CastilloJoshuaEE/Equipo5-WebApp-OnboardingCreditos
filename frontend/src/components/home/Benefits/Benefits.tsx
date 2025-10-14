import Image from "next/image";
import styles from "./Benefits.module.css";

export default function Benefits() {
  const benefits = [
    {
      icon: "/iconos/clockIcon.svg",
      text: "Ahorra tiempo valioso en trámites burocráticos y gestiones complejas.",
    },
    {
      icon: "/iconos/lineupIcon.svg",
      text: "Impulsa el crecimiento y la innovación de tu negocio con capital fresco.",
    },
    {
      icon: "/iconos/lightBulbIcon.svg",
      text: "Toma decisiones financieras informadas con asesoramiento experto y transparente.",
    },
  ];

  return (
    <section className={styles.benefits} id="benefits">
      <div className={styles.headlineBenefits}>
        <h2>Lo que obtendrás con nosotros</h2>
        <p>
          Beneficios tangibles para el crecimiento y la estabilidad de tu
          negocio.
        </p>
      </div>
      <div className={styles.benefitCenter}>
        <ul>
          {benefits.map((benefit, index) => (
            <li key={index}>
              <Image
                src={benefit.icon}
                alt="Beneficio"
                width={40}
                height={40}
              />
              <p>{benefit.text}</p>
            </li>
          ))}
        </ul>
        <Image
          className={styles.benefitsIllustration}
          src="/ilustraciones/sectionBenefitsIllustration.webp"
          alt="Ilustración de Beneficios"
          width={500}
          height={400}
        />
      </div>
    </section>
  );
}
