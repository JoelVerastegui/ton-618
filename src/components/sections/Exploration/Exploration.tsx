import { useEffect, useRef } from 'react';
import { useInView } from '@/hooks/useInView';
import { useExplorationLevel } from '@/hooks/useExplorationLevel';
import { useTrackProgress } from '@/hooks/useTrackProgress';
import explorationJson from '@/data/exploration.json';
import type { ExplorationData } from '@/interfaces/exploration';
import { LevelNav } from '@/components/sections/Exploration/LevelNav';
import { MapLayers } from '@/components/sections/Exploration/MapLayers';
import { levelLabel } from '@/utils/levelLabel';
import styles from '@/components/sections/Exploration/Exploration.module.scss';

const exploration = explorationJson as ExplorationData;

// Id del encabezado que nombra la sección (aria-labelledby).
const TITLE_ID = 'explorationTitle';
// Retardo antes de anunciar el cambio de nivel (evita ruido durante el scroll rápido).
const ANNOUNCE_DELAY_MS = 400;

const levels = [...exploration.levels].sort((a, b) => a.order - b.order);
const levelIds = levels.map((level) => level.id);
const cards = [...exploration.cards].sort((a, b) => a.order - b.order);

export function Exploration() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sentinelsRef = useRef<HTMLDivElement>(null);
  const anchorsRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const announcedLevel = useRef(1);
  useInView(sectionRef);
  useTrackProgress(sectionRef, trackRef);
  const { level, goTo } = useExplorationLevel(sectionRef, sentinelsRef, anchorsRef, levelIds);

  // Región aria-live: se escribe en el DOM (sin estado) 400 ms después del cambio.
  useEffect(() => {
    if (level === announcedLevel.current) return;
    const timer = window.setTimeout(() => {
      announcedLevel.current = level;
      if (liveRef.current) {
        liveRef.current.textContent = levelLabel(level, levels.length, levels[level - 1].title);
      }
    }, ANNOUNCE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [level]);

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
      <p ref={liveRef} className={styles.live} role='status' aria-live='polite' />

      <div ref={trackRef} className={styles.track}>
        <div className={styles.stage}>
          <LevelNav levels={levels} level={level} onSelect={goTo} />

          {/* Equivalente textual del mapa (el SVG será aria-hidden) */}
          <div className={styles.summaries}>
            {levels.map((item) => (
              <p key={item.id} className={styles.summary}>
                <span className={styles.summaryTitle}>{item.title}</span> {item.mapSummary}
              </p>
            ))}
          </div>

          <div className={styles.blackout} aria-hidden='true' />

          <MapLayers />

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

        {/* Posiciones del track para el nivel activo (IntersectionObserver) y para goTo */}
        <div ref={sentinelsRef} className={styles.sentinels} aria-hidden='true'>
          {levels.map((item) => (
            <span key={item.id} className={styles.sentinel} />
          ))}
        </div>
        <div ref={anchorsRef} className={styles.anchors} aria-hidden='true'>
          {levels.map((item) => (
            <span key={item.id} className={styles.anchor} />
          ))}
        </div>
      </div>
    </section>
  );
}
