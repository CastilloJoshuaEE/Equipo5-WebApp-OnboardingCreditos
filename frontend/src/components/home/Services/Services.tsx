// frontend/src/components/home/Services/Services.tsx
import Image from "next/image";
import styles from "./Services.module.css";

export default function Services() {
  const services = [
    {
      icon: "/iconos/rocketIcon.svg",
      title: "Proceso Ágil y Digital",
      description: "Completa tu solicitud en minutos, 100% online.",
    },
    {
      icon: "/iconos/shieldIcon.svg",
      title: "Seguridad y Confianza",
      description:
        "Tus datos protegidos con tecnología de cifrado y estándares de la industria.",
    },
    {
      icon: "/iconos/creationIcon.svg",
      title: "Ofertas Personalizadas",
      description:
        "Créditos diseñados a la medida de las necesidades de tu PYME.",
    },
  ];

  return (
    <section className={styles.services} id="services">
      <div className={styles.servicesCenter}>
        <div className={styles.headlineServices}>
          <h2>Servicios Clave</h2>
          <p>Diseñado para la eficiencia y la seguridad de tu empresa.</p>
        </div>
        <div className={styles.cards}>
          {services.map((service, index) => (
            <div key={index} className={styles.card}>
              <Image
                src={service.icon}
                alt={service.title}
                width={48}
                height={48}
              />
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
