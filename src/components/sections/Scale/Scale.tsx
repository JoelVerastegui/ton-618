import { useRef } from 'react';
import { useInView } from '@/hooks/useInView';
import scaleJson from '@/data/scale.json';
import type { ScaleData } from '@/interfaces/scale';
import { Viewer } from '@/components/sections/Scale/Viewer';
import styles from '@/components/sections/Scale/Scale.module.scss';

const scale = scaleJson as ScaleData;

// Id del encabezado que nombra la sección (aria-labelledby).
const TITLE_ID = 'scaleTitle';

export function Scale() {
  const sectionRef = useRef<HTMLElement>(null);
  useInView(sectionRef);

  return (
    <section ref={sectionRef} id='scale' aria-labelledby={TITLE_ID} className={styles.section}>
      <div className={styles.stage}>
        <header className={styles.header}>
          <h2 id={TITLE_ID} className={styles.title}>
            {scale.title}
          </h2>
          <p className={styles.hint}>{scale.hint}</p>
        </header>

        {/* Equivalente textual de la escena (el visor es aria-hidden) */}
        <p className={styles.summary}>{scale.summary}</p>

        <Viewer />
      </div>
    </section>
  );
}
