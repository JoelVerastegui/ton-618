import { useRef, type CSSProperties } from 'react';
import { useTrackProgress } from '@/hooks/useTrackProgress';
import { Distortion } from '@/components/ui/Distortion/Distortion';
import timeJson from '@/data/time.json';
import type { TimeData } from '@/interfaces/time';
import blackHole from '@/assets/images/hero/ton618-blackhole-1024.webp';
import earth from '@/assets/images/scale/earth.webp';
import { SKY_LAYERS } from '@/utils/scaleSky';
import { LABEL_LANE, MILESTONE_POS, type TimeLabelId } from '@/utils/timeScale';
import styles from '@/components/sections/Time/Time.module.scss';

const time = timeJson as TimeData;

// Id del encabezado que nombra la sección (aria-labelledby).
const TITLE_ID = 'timeTitle';

// Etiquetas en orden de lectura: salida, los cinco hitos y llegada. La posición en la línea
// (0-1) llega al CSS por `--pos`.
const LABELS: { id: TimeLabelId; label: string; when: string; pos: number }[] = [
  { id: 'departure', ...time.departure, pos: 0 },
  ...time.milestones.map((item) => ({ ...item, pos: MILESTONE_POS[item.id] })),
  { id: 'arrival', ...time.arrival, pos: 1 },
];

export function Time() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // Sin `animation-timeline` escribe `--progress` en la sección (sin estado de React)
  useTrackProgress(sectionRef, trackRef);

  return (
    <section id='time' ref={sectionRef} aria-labelledby={TITLE_ID} className={styles.section}>
      <div ref={trackRef} className={styles.track}>
        <div className={styles.stage}>
          <p className={styles.summary}>{time.summary}</p>

          {/* Cielo decorativo */}
          <div className={styles.sky} aria-hidden='true'>
            <div className={styles.nebulaMask}>
              <div className={styles.nebula} />
            </div>
            {SKY_LAYERS.map((layer) => (
              <svg
                key={layer.id}
                className={`${styles.stars} ${styles[layer.id]}`}
                viewBox='0 0 1000 1000'
                preserveAspectRatio='xMidYMid slice'
                focusable='false'
              >
                <path d={layer.path} />
              </svg>
            ))}
          </div>

          <header className={styles.header}>
            <h2 id={TITLE_ID} className={styles.title}>
              {time.title}
            </h2>
            <p className={styles.subtitle}>{time.subtitle}</p>
          </header>

          <div className={styles.line}>
            <div className={styles.bar} aria-hidden='true'>
              <div className={styles.fill} />
            </div>
            <span className={`${styles.end} ${styles.origin}`} aria-hidden='true'>
              <img
                className={styles.endImage}
                src={blackHole}
                alt=''
                width={1024}
                height={1024}
                decoding='async'
              />
            </span>
            <span className={`${styles.end} ${styles.destination}`} aria-hidden='true'>
              <img
                className={styles.endImage}
                src={earth}
                alt=''
                width={560}
                height={560}
                decoding='async'
              />
            </span>
            <span className={styles.halo} aria-hidden='true' />
            <span className={styles.particle} aria-hidden='true' />

            <ol className={styles.items}>
              {LABELS.map((item) => (
                <li
                  key={item.id}
                  className={styles.item}
                  data-id={item.id}
                  data-side={LABEL_LANE[item.id].side}
                  data-lane={LABEL_LANE[item.id].lane}
                  style={{ '--pos': item.pos } as CSSProperties}
                >
                  <span className={styles.dot} aria-hidden='true' />
                  <span className={styles.label}>
                    <span className={styles.name}>{item.label}</span>
                    <span className={styles.when}>{item.when}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <p className={styles.hint}>{time.hint}</p>
          <p className={styles.message}>{time.message}</p>

          {/* Salida hacia Experimento: transición de estrellas de abajo hacia arriba (solo anima en la cola final) */}
          <Distortion />
        </div>
      </div>
    </section>
  );
}
