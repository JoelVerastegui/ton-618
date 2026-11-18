import clsx from 'clsx';
import { useRef } from 'react';
import { HeroScene } from '@/components/sections/Hero/HeroScene';
import { Button } from '@/components/ui/Button/Button';
import heroJson from '@/data/hero.json';
import { useInView } from '@/hooks/useInView';
import { useParallaxPointer } from '@/hooks/useParallaxPointer';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import type { HeroData } from '@/interfaces/hero';
import styles from '@/components/sections/Hero/Hero.module.scss';

const hero = heroJson as HeroData;

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  useInView(heroRef);
  useParallaxPointer(heroRef);
  useScrollProgress(heroRef);

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
            <p className={styles.kicker}>{hero.kicker}</p>
            <h1 id='heroTitle' className={styles.title}>
              <span className={styles.titleMain}>{hero.title.main}</span>
              <span className={styles.titleTagline}>{hero.title.tagline}</span>
            </h1>
            <p className={styles.subtitle}>{hero.subtitle}</p>
            <Button className={styles.cta} href={`#${hero.cta.targetSectionId}`}>
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
