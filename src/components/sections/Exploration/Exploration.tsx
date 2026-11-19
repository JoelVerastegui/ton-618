import clsx from 'clsx';
import explorationJson from '@/data/exploration.json';
import type { ExplorationData } from '@/interfaces/exploration';
import styles from '@/components/sections/Exploration/Exploration.module.scss';

const exploration = explorationJson as ExplorationData;

// Id de ancla de la línea temporal (la implementa el paso 9 del spec).
const TIMELINE_ID = 'explorationTimeline';
const TITLE_ID = 'explorationTitle';

export function Exploration() {
  const levels = [...exploration.levels].sort((a, b) => a.order - b.order);
  const cards = [...exploration.cards].sort((a, b) => a.order - b.order);

  return (
    <section id='exploration' aria-labelledby={TITLE_ID} className={styles.section}>
      <h2 id={TITLE_ID} className={styles.srOnly}>
        {exploration.title}
      </h2>

      <div className={styles.track}>
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

          <div className={styles.map} aria-hidden='true'>
            {/* Provisional (paso 3): marcador central para validar el layout.
                Las capas SVG del mapa llegan en el paso 4. */}
            <span className={styles.markerPlaceholder} />
          </div>

          <p className={styles.legend}>{exploration.mapLegend}</p>

          {cards.map((card, index) => (
            <article
              key={card.id}
              className={clsx(styles.card, index === 0 && styles.cardActive)}
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
