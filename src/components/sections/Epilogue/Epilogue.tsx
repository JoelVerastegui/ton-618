import { useRef } from 'react';
import { SkyBackground } from '@/components/ui/SkyBackground/SkyBackground';
import greatAttractor from '@/assets/images/epilogue/great-attractor.webp';
import epilogueJson from '@/data/epilogue.json';
import { useInView } from '@/hooks/useInView';
import { useParallaxPointer } from '@/hooks/useParallaxPointer';
import type { EpilogueData } from '@/interfaces/epilogue';
import styles from '@/components/sections/Epilogue/Epilogue.module.scss';

const epilogue = epilogueJson as EpilogueData;

// Id del encabezado que nombra la sección (aria-labelledby).
const TITLE_ID = 'epilogueTitle';

export function Epilogue() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // Sección: pausa de animaciones fuera de vista. Texto: reveal de una sola vez.
  useInView(sectionRef);
  useInView(contentRef, true);
  useParallaxPointer(sectionRef);

  return (
    <section ref={sectionRef} id='epilogue' aria-labelledby={TITLE_ID} className={styles.section}>
      <SkyBackground variant='void' />

      <div className={styles.art} aria-hidden='true'>
        <img
          className={styles.image}
          src={greatAttractor}
          width={1024}
          height={1024}
          alt=''
          loading='lazy'
          decoding='async'
        />
        <div className={styles.core} />
      </div>

      <div className={styles.marker} aria-hidden='true'>
        <span className={styles.markerDot} />
        <span className={styles.markerLabel}>{epilogue.markerLabel}</span>
      </div>

      <p className={styles.summary}>{epilogue.summary}</p>

      <div ref={contentRef} className={styles.content}>
        <p className={styles.message}>{epilogue.message}</p>
        <h2 id={TITLE_ID} className={styles.question}>
          {epilogue.question}
        </h2>
      </div>
    </section>
  );
}
