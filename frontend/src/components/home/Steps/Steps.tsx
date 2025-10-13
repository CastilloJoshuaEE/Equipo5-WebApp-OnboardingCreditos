import styles from "./Steps.module.css";

export default function Steps() {
  const steps = [
    {
      number: 1,
      title: "Registra tu cuenta",
      description:
        "Crea tu cuenta y proporciona información básica de tu negocio.",
    },
    {
      number: 2,
      title: "Completa la Solicitud",
      description: "Responde el formulario y sube la documentación requerida.",
    },
    {
      number: 3,
      title: "Recibe tu Respuesta",
      description:
        "Obtén una respuesta rápida y firma digitalmente tu contrato.",
    },
  ];

  return (
    <section className={styles.steps}>
      <h2>Proceso simple en 3 pasos</h2>
      <div className={styles.stepsContainer}>
        {steps.map((step) => (
          <div key={step.number} className={styles.step}>
            <div className={styles.circle}>{step.number}</div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
