import { useRef } from 'react';
import { SkyBackground } from '@/components/ui/SkyBackground/SkyBackground';
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
  useInView(sectionRef);
  useParallaxPointer(sectionRef);

  return (
    <section ref={sectionRef} id='epilogue' aria-labelledby={TITLE_ID} className={styles.section}>
      <SkyBackground variant='void' />

      <p className={styles.summary}>{epilogue.summary}</p>

      <div className={styles.content}>
        <p className={styles.message}>{epilogue.message}</p>
        <h2 id={TITLE_ID} className={styles.question}>
          {epilogue.question}
        </h2>
      </div>
    </section>
  );
}
