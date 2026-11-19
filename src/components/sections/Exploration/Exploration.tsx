import { useRef } from 'react';
import { useInView } from '@/hooks/useInView';
import { useTrackProgress } from '@/hooks/useTrackProgress';
import explorationJson from '@/data/exploration.json';
import type { ExplorationData } from '@/interfaces/exploration';
import { MapLayers } from '@/components/sections/Exploration/MapLayers';
import styles from '@/components/sections/Exploration/Exploration.module.scss';

const exploration = explorationJson as ExplorationData;

// Id de ancla de la línea temporal (la implementa el paso 9 del spec).
const TIMELINE_ID = 'explorationTimeline';
const TITLE_ID = 'explorationTitle';

export function Exploration() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  useInView(sectionRef);
  useTrackProgress(sectionRef, trackRef);

  const levels = [...exploration.levels].sort((a, b) => a.order - b.order);
  const cards = [...exploration.cards].sort((a, b) => a.order - b.order);

  return (
    <section
      ref={sectionRef}
      id='exploration'
      aria-labelledby={TITLE_ID}
      className={styles.section}
    >
      <h2 id={TITLE_ID} className={styles.srOnly}>
        {exploration.title}
      </h2>

      <div ref={trackRef} className={styles.track}>
        <div className={styles.stage}>
          <a className={styles.skipLink} href={`#${TIMELINE_ID}`}>
            {exploration.skipLinkLabel}
          </a>

          {/* Equivalente textual del mapa (el SVG será aria-hidden) */}
          <div className={styles.srOnly}>
            {levels.map((level) => (
              <p key={level.id}>{level.mapSummary}</p>
            ))}
          </div>

          <MapLayers />

          <p className={styles.legend}>{exploration.mapLegend}</p>

          {cards.map((card) => (
            <article
              key={card.id}
              className={styles.card}
              aria-labelledby={`explorationCard-${card.id}`}
            >
              <p className={styles.cardKicker}>{card.kicker}</p>
              <h3 id={`explorationCard-${card.id}`} className={styles.cardQuestion}>
                {card.question}
              </h3>
              <p className={styles.cardAnswer}>{card.answer}</p>
            </article>
          ))}

          <div className={styles.scrim} aria-hidden='true' />
        </div>
      </div>

      {/* Ancla de la línea temporal (contenido en el paso 9) */}
      <div id={TIMELINE_ID} className={styles.timelineAnchor} tabIndex={-1} />
    </section>
  );
}
