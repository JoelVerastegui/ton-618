import { useCallback, useRef } from 'react';
import { useInView } from '@/hooks/useInView';
import { useSceneReady } from '@/hooks/useSceneReady';
import { useSectionFaded } from '@/hooks/useSectionFaded';
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
  // `data-faded` en el visor cuando el fundido final terminó: pausa el vídeo del Sol
  const fadedRef = useRef<HTMLSpanElement>(null);
  useSectionFaded(viewerRef, fadedRef);

  // Lista hasta que empieza el fundido final (el control queda inerte; sin estado extra de scroll)
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const noop = useCallback(() => {}, []);
  const ready = useSceneReady(sentinelRef, noop);

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
              inert={!ready}
            />
          </div>
        </div>
        <div className={styles.introSpan} aria-hidden='true' />
        <div className={styles.fadeSpan} aria-hidden='true' />

        {/* Desde lo alto del track hasta el inicio del fundido final (ver `useSceneReady`) */}
        <span ref={sentinelRef} className={styles.sentinel} aria-hidden='true' />

        {/* Desde el final del track hacia abajo: el fundido terminó (ver `useSectionFaded`) */}
        <span ref={fadedRef} className={styles.fadedSentinel} aria-hidden='true' />
        <span data-arrival='scale' className={styles.arrival} aria-hidden='true' />
      </div>
    </section>
  );
}
