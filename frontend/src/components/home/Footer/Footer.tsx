import Image from "next/image";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer id="contacts" className={styles.footer}>
      <section className={styles.footerCenter}>
        <Image
          className={styles.footerImage}
          src="/ilustraciones/sectionContactanosIllustration.webp"
          alt="Atención al usuario"
          width={300}
          height={300}
        />
        <div className={styles.contactInfo}>
          <div className={styles.headlineFooter}>
            <h2>Contáctanos</h2>
            <p>
              Estamos aquí para ayudarte a obtener la financiación que
              necesitas.
            </p>
          </div>

          <ul>
            <li>
              <Image
                src="/iconos/phoneIcon.svg"
                alt="Teléfono"
                width={28}
                height={28}
              />
              <p>+51 987 654 321</p>
            </li>
            <li>
              <Image
                src="/iconos/emailIcon.svg"
                alt="Email"
                width={28}
                height={28}
              />
              <p>contacto@nexia.com</p>
            </li>
            <li>
              <Image
                src="/iconos/locationIcon.svg"
                alt="Ubicación"
                width={28}
                height={28}
              />
              <p>Av. Principal 123, Lima, Perú</p>
            </li>
          </ul>
        </div>
      </section>

      <section className={styles.socialMediaSection}>
        <div className={styles.socialMediaCenter}>
          <div className={styles.contact}>
          
          </div>
          <div className={styles.socialMedia}>
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/iconos/LinkedInIcon.svg"
                alt="LinkedIn"
                width={28}
                height={28}
              />
            </a>
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/iconos/facebookIcon.svg"
                alt="Facebook"
                width={28}
                height={28}
              />
            </a>
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/iconos/youtubeIcon.svg"
                alt="Youtube"
                width={28}
                height={28}
              />
            </a>
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/iconos/instagramIcon.svg"
                alt="Instagram"
                width={28}
                height={28}
              />
            </a>
            <a
              href="https://www.whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/iconos/whatsappIcon.svg"
                alt="WhatsApp"
                width={28}
                height={28}
              />
            </a>
          </div>
        </div>
      </section>
    </footer>
  );
}
