// frontend/src/app/page.tsx
import {
  Navbar,
  HeroSection,
  Steps,
  Services,
  Benefits,
  Advantages,
  Testimonials,
  Footer,
} from "@/components";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.container}>
        {/* Ellipse decorations */}
        <div className={styles.ellipse1}>
          <img src="/ilustraciones/ellipse.png" alt="Elipse decorativa" />
        </div>
        <div className={styles.ellipse2}>
          <img src="/ilustraciones/ellipse.png" alt="Elipse decorativa" />
        </div>

        <HeroSection />
        <Steps />
        <Services />
        <Benefits />
        <Advantages />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
