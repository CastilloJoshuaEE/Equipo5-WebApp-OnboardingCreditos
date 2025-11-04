import styles from "./Steps.module.css";

export default function Steps() {
  const steps = [
    {
      number: 1,
      title: "Registra tu cuenta",
      description: "Crea tu cuenta y proporciona información básica de tu negocio.",
    },
    {
      number: 2,
      title: "Completa la Solicitud",
      description: "Responde el formulario y sube la documentación requerida.",
    },
    {
      number: 3,
      title: "Recibe tu Respuesta",
      description: "Obtén una respuesta rápida y firma digitalmente tu contrato.",
    },
  ];

  return (
    <section className={styles.steps}>
      <div className={styles.stepsContainer}>
        <h2 className={styles.stepsTitle}>Proceso simple en 3 pasos</h2>
        <p className={styles.stepsSubtitle}>
          Obtén el financiamiento que tu PYME necesita de manera rápida y segura
        </p>
        
        <div className={styles.stepsGrid}>
          {steps.map((step, index) => (
            <div key={step.number} className={styles.step}>
              <div className={styles.stepContent}>
                <div className={styles.stepHeader}>
                  <div className={styles.circle}>{step.number}</div>
                  {index < steps.length - 1 && (
                    <div className={styles.connector} aria-hidden="true"></div>
                  )}
                </div>
                <div className={styles.stepBody}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}