import clsx from 'clsx';
import { useRef, type MouseEvent } from 'react';
import { HeroScene } from '@/components/sections/Hero/HeroScene';
import { Button } from '@/components/ui/Button/Button';
import heroJson from '@/data/hero.json';
import { useInView } from '@/hooks/useInView';
import { useParallaxPointer } from '@/hooks/useParallaxPointer';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import type { HeroData } from '@/interfaces/hero';
import { scrollToElement } from '@/utils/scrollTo';
import styles from '@/components/sections/Hero/Hero.module.scss';

const hero = heroJson as HeroData;

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  useInView(heroRef);
  useParallaxPointer(heroRef);
  useScrollProgress(heroRef);

  // Scroll hasta la sección destino. Es suave salvo con prefers-reduced-motion.
  // Si el destino aún no existe (la sección 2 es de otro spec), no hace nada.
  const handleCtaClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const target = document.getElementById(hero.cta.targetSectionId);
    if (!target) return;

    scrollToElement(target);
  };

  return (
    <section ref={heroRef} id='hero' aria-labelledby='heroTitle'>
      <div className={styles.track}>
        <div className={styles.stage}>
          <HeroScene />
          <div
            className={clsx(
              styles.content,
              'container d-flex flex-column align-items-center text-center'
            )}
          >
            <h1 id='heroTitle' className={styles.title}>
              <span className={styles.titleMain}>{hero.title.main}</span>
              <span className={styles.titleTagline}>{hero.title.tagline}</span>
            </h1>
            <p className={styles.subtitle}>{hero.subtitle}</p>
            <Button
              className={styles.cta}
              href={`#${hero.cta.targetSectionId}`}
              onClick={handleCtaClick}
            >
              {hero.cta.label}
            </Button>
          </div>
          <p className={styles.caption}>{hero.artwork.caption}</p>
          <div className={styles.overlay} aria-hidden='true' />
        </div>
      </div>
    </section>
  );
}
