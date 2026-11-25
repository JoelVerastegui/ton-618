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

// Fracción de la sección que debe verse para revelar el Gran Atractor.
const ART_REVEAL_THRESHOLD = 0.75;

export function Epilogue() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // Sección: pausa de animaciones fuera de vista. Texto y Gran Atractor: reveal de
  // una sola vez (el escenario cubre la sección, así que el umbral es el de la sección).
  useInView(sectionRef);
  useInView(stageRef, true, ART_REVEAL_THRESHOLD);
  useInView(contentRef, true);
  useParallaxPointer(sectionRef);

  return (
    <section ref={sectionRef} id='epilogue' aria-labelledby={TITLE_ID} className={styles.section}>
      <SkyBackground variant='void' />

      <div ref={stageRef} className={styles.stage} aria-hidden='true'>
        <div className={styles.art}>
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

        <div className={styles.marker}>
          <span className={styles.markerDot} />
          <span className={styles.markerLabel}>{epilogue.markerLabel}</span>
        </div>
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
