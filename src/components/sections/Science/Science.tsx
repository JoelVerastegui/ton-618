import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from '@/hooks/useInView';
import { useTrackProgress } from '@/hooks/useTrackProgress';
import { useSceneReady } from '@/hooks/useSceneReady';
import { useSectionFaded } from '@/hooks/useSectionFaded';
import scienceJson from '@/data/science.json';
import type { ScienceData, SciencePointId } from '@/interfaces/science';
import { PointCard } from '@/components/sections/Science/PointCard';
import { PointMarkers } from '@/components/sections/Science/PointMarkers';
import { PointNav } from '@/components/sections/Science/PointNav';
import { Viewer } from '@/components/sections/Science/Viewer';
import { cardTitleId } from '@/utils/cardTitleId';
import styles from '@/components/sections/Science/Science.module.scss';

const science = scienceJson as ScienceData;

// Id del encabezado que nombra la sección (aria-labelledby).
const TITLE_ID = 'scienceTitle';

const points = [...science.points].sort((a, b) => a.order - b.order);

// A dónde va el foco tras el siguiente cambio de punto.
type FocusTarget = 'card' | 'marker' | null;

export function Science() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const focusTarget = useRef<FocusTarget>(null);
  const lastPoint = useRef<SciencePointId | null>(null);
  // Un único estado: el punto abierto (o ninguno). Un clic = un render de esta sección.
  const [point, setPoint] = useState<SciencePointId | null>(null);
  useInView(sectionRef);
  useTrackProgress(sectionRef, trackRef);

  const fadedRef = useRef<HTMLSpanElement>(null);
  useSectionFaded(sectionRef, fadedRef);

  const closeSilently = useCallback(() => setPoint(null), []);
  const ready = useSceneReady(sentinelRef, closeSilently);

  const open = useCallback((id: SciencePointId) => {
    focusTarget.current = 'card';
    lastPoint.current = id;
    setPoint(id);
  }, []);

  const switchTo = useCallback((id: SciencePointId) => {
    focusTarget.current = null;
    lastPoint.current = id;
    setPoint(id);
  }, []);

  const close = useCallback(() => {
    focusTarget.current = 'marker';
    setPoint(null);
  }, []);

  // Foco: al abrir con un marcador pasa al título de la tarjeta; al cerrar vuelve al marcador.
  useEffect(() => {
    if (point && focusTarget.current === 'card') {
      document.getElementById(cardTitleId(point))?.focus({ preventScroll: true });
    } else if (!point && focusTarget.current === 'marker') {
      sectionRef.current
        ?.querySelector<HTMLElement>(`[data-point-id='${lastPoint.current}']`)
        ?.focus({ preventScroll: true });
    }
    focusTarget.current = null;
  }, [point]);

  // `Esc` cierra el punto abierto.
  useEffect(() => {
    if (!point) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [point, close]);

  const active = points.find((item) => item.id === point);

  return (
    <section
      ref={sectionRef}
      id='science'
      aria-labelledby={TITLE_ID}
      className={styles.section}
      data-ready={ready}
      data-point={point ?? undefined}
    >
      <div ref={trackRef} className={styles.track}>
        <div className={styles.stage}>
          <header className={styles.header}>
            <h2 id={TITLE_ID} className={styles.title}>
              {science.title}
            </h2>
            <p className={styles.hint}>{science.hint}</p>
          </header>

          {/* Equivalente textual de la ilustración (el visor es aria-hidden) */}
          <p className={styles.summary}>{science.summary}</p>

          <Viewer sectionRef={sectionRef} />

          <PointMarkers points={points} inert={!ready || point !== null} onSelect={open} />

          <div className={styles.panel}>
            <div aria-live='polite'>{active && <PointCard key={active.id} point={active} />}</div>
            {active && (
              <PointNav points={points} active={active.id} onSelect={switchTo} onClose={close} />
            )}
          </div>

          {/* Párpados de la intro (ver «Intro con el scroll» en el SCSS) */}
          <span className={clsx(styles.lid, styles.lidTop)} aria-hidden='true' />
          <span className={clsx(styles.lid, styles.lidBottom)} aria-hidden='true' />
        </div>

        {/* Desde la parada «lista» hasta el final del track (ver `useSceneReady`) */}
        <span ref={sentinelRef} className={styles.sentinel} aria-hidden='true' />

        {/* Desde el final del track hacia abajo: el fundido terminó (ver `useSectionFaded`) */}
        <span ref={fadedRef} className={styles.fadedSentinel} aria-hidden='true' />
      </div>
    </section>
  );
}
