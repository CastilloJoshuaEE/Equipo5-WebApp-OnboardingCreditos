"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./Testimonials.module.css";

interface Testimonial {
  avatar: string;
  quote: string;
  name: string;
  position: string;
}

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials: Testimonial[] = [
    {
      avatar: "/avatars/sectionTestimonialsAvatar1.svg",
      quote:
        "Gracias a Nexia, pude expandir mi negocio justo cuando lo necesitaba. El proceso fue increíblemente sencillo y rápido.",
      name: "Ana Lopez",
      position: "Dueña de Café del Sol",
    },
    {
      avatar: "/avatars/sectionTestimonialsAvatar2.svg",
      quote:
        "La plataforma de Nexia me permitió financiar mi proyecto en el momento indicado. Un servicio rápido y fácil.",
      name: "Laura García",
      position: "Propietaria de 'Panadería La Dulce Vida'",
    },
    {
      avatar: "/avatars/sectionTestimonialsAvatar3.svg",
      quote:
        "La transparencia y el soporte que recibí fueron excepcionales. Recomiendo este servicio a todas las PYMES que buscan financiación.",
      name: "Carlos Ruis",
      position: "Gerente de TecnoSoluciones",
    },
    {
      avatar: "/avatars/sectionTestimonialsAvatar4.svg",
      quote:
        "Con Nexia logré acceder al crédito ideal para crecer mi empresa. Todo fue claro, ágil y confiable.",
      name: "Carlos Mendez",
      position: "Fundador de 'Textiles Andes'",
    },
    {
      avatar: "/avatars/sectionTestimonialsAvatar5.svg",
      quote:
        "Obtener mi crédito con Nexia fue simple y sin trámites complicados. Así impulsé mi emprendimiento.",
      name: "Jorge Ramírez",
      position: "Gerente de 'Ferretería El Martillo'",
    },
    {
      avatar: "/avatars/sectionTestimonialsAvatar6.svg",
      quote:
        "Gracias a Nexia conseguí capital para innovar en mi negocio. El trámite fue ágil, práctico y seguro.",
      name: "Sofía Torres",
      position: "Socia de 'Diseños Creativos'",
    },
  ];

  const handlePrevious = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  // Autoplay
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <section className={styles.testimonials}>
      <div className={styles.headlineTestimony}>
        <h2>Lo que dicen nuestros clientes</h2>
        <p>Historias de éxito que inspiran confianza en nuestra plataforma.</p>
      </div>
      <div className={styles.slider}>
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className={`${styles.slide} ${
              index === currentIndex ? styles.active : ""
            }`}
          >
            <Image
              src={testimonial.avatar}
              alt={testimonial.name}
              width={80}
              height={80}
            />
            <blockquote>{testimonial.quote}</blockquote>
            <p>
              <strong>{testimonial.name}</strong>
              <span>{testimonial.position}</span>
            </p>
          </div>
        ))}
      </div>
      <div className={styles.sliderButtons}>
        <button onClick={handlePrevious} aria-label="Anterior">
          <Image
            src="/iconos/arrowLeftIcon.svg"
            alt="Anterior"
            width={20}
            height={20}
          />
        </button>
        <button onClick={handleNext} aria-label="Siguiente">
          <Image
            src="/iconos/arrowRightIcon.svg"
            alt="Siguiente"
            width={20}
            height={20}
          />
        </button>
      </div>
    </section>
  );
}
