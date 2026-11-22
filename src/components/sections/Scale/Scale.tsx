import { useRef } from 'react';
import { useInView } from '@/hooks/useInView';
import { useScaleZoom } from '@/hooks/useScaleZoom';
import scaleJson from '@/data/scale.json';
import type { ScaleData } from '@/interfaces/scale';
import { Viewer } from '@/components/sections/Scale/Viewer';
import { StopCard } from '@/components/sections/Scale/StopCard';
import { ScaleSlider } from '@/components/sections/Scale/ScaleSlider';
import styles from '@/components/sections/Scale/Scale.module.scss';

const scale = scaleJson as ScaleData;

// Id del encabezado que nombra la sección (aria-labelledby).
const TITLE_ID = 'scaleTitle';

export function Scale() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  useInView(sectionRef);

  // El valor continuo vive en refs (visor e input) y viene del scroll del track; el único estado
  // es la parada activa.
  const viewerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { scrollToValue, animateTo, activeStop } = useScaleZoom(trackRef, viewerRef, inputRef);
  const stop = scale.stops.find((item) => item.id === activeStop) ?? scale.stops[0];

  return (
    <section
      ref={sectionRef}
      id='scale'
      aria-labelledby={TITLE_ID}
      className={styles.section}
      data-stop={activeStop}
    >
      <div ref={trackRef} className={styles.track}>
        <div className={styles.stage}>
          {/* Equivalente textual de la escena (el visor es aria-hidden) */}
          <p className={styles.summary}>{scale.summary}</p>

          <Viewer viewerRef={viewerRef} />

          {/* Anuncio del cambio de parada: solo al cruzar el umbral, no durante el arrastre */}
          <p className={styles.summary} aria-live='polite'>
            {stop.title}
          </p>

          <div className={styles.panel}>
            <header className={styles.header}>
              <h2 id={TITLE_ID} className={styles.title}>
                {scale.title}
              </h2>
              <p className={styles.hint}>{scale.hint}</p>
            </header>
            <StopCard key={stop.id} stop={stop} />
            <ScaleSlider
              stops={scale.stops}
              activeStop={activeStop}
              inputRef={inputRef}
              onValue={scrollToValue}
              onStop={animateTo}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
