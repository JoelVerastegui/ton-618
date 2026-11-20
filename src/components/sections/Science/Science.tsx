import { useRef } from 'react';
import { useInView } from '@/hooks/useInView';
import scienceJson from '@/data/science.json';
import type { ScienceData } from '@/interfaces/science';
import quasar from '@/assets/images/science/quasar-1536.webp';
import styles from '@/components/sections/Science/Science.module.scss';

const science = scienceJson as ScienceData;

// Id del encabezado que nombra la sección (aria-labelledby).
const TITLE_ID = 'scienceTitle';

const points = [...science.points].sort((a, b) => a.order - b.order);

export function Science() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  useInView(sectionRef);

  return (
    <section ref={sectionRef} id='science' aria-labelledby={TITLE_ID} className={styles.section}>
      <div ref={trackRef} className={styles.track}>
        <div className={styles.stage}>
          <div className={styles.starLayer} aria-hidden='true' />

          <header className={styles.header}>
            <h2 id={TITLE_ID} className={styles.title}>
              {science.title}
            </h2>
            <p className={styles.hint}>{science.hint}</p>
          </header>

          {/* Equivalente textual de la ilustración (el visor es aria-hidden) */}
          <p className={styles.summary}>{science.summary}</p>

          <div className={styles.viewer} aria-hidden='true'>
            <div className={styles.camera}>
              <img
                className={styles.quasar}
                src={quasar}
                alt=''
                width={1536}
                height={1536}
                decoding='async'
              />
            </div>
          </div>

          {points.map((point) => (
            <article
              key={point.id}
              className={styles.card}
              aria-labelledby={`scienceCard-${point.id}`}
            >
              <p className={styles.cardKicker}>{point.kicker}</p>
              <h3 id={`scienceCard-${point.id}`} className={styles.cardTitle}>
                {point.title}
              </h3>
              <p className={styles.cardAnswer}>{point.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
