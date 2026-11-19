import { useRef } from 'react';
import { useInView } from '@/hooks/useInView';
import explorationJson from '@/data/exploration.json';
import type { ExplorationData } from '@/interfaces/exploration';
import styles from '@/components/sections/Exploration/ExplorationTimeline.module.scss';

const exploration = explorationJson as ExplorationData;

const events = [...exploration.timeline].sort((a, b) => a.order - b.order);
const sourceById = new Map(exploration.sources.map((source) => [source.id, source]));

// «Shemmer et al., 2004»
const citation = (id: string) => {
  const source = sourceById.get(id);
  return source ? `${source.authors}, ${source.year}` : null;
};

// Línea temporal de hitos: horizontal desde `$timelineBreak` de ancho de contenedor
// y vertical por debajo. La entrada (línea y hitos) se activa una sola vez al verse.
export function ExplorationTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  useInView(ref, true);

  return (
    <div ref={ref} className={styles.timeline}>
      <ol className={styles.list}>
        {events.map((event) => (
          <li key={event.id} className={styles.item}>
            <time className={styles.year} dateTime={String(event.year)}>
              {event.date}
            </time>
            <h3 className={styles.title}>{event.title}</h3>
            <p className={styles.description}>{event.description}</p>
            <p className={styles.sources}>
              {event.sources.map(citation).filter(Boolean).join(' · ')}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
