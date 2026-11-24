import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useBlackHole } from '@/hooks/useBlackHole';
import { useSectionFaded } from '@/hooks/useSectionFaded';
import { useTrackProgress } from '@/hooks/useTrackProgress';
import { Distortion } from '@/components/ui/Distortion/Distortion';
import { Joystick } from '@/components/ui/Joystick/Joystick';
import { useInView } from '@/hooks/useInView';
import experimentJson from '@/data/experiment.json';
import type { ExperimentData } from '@/interfaces/experiment';
import { ORBIT_STEP, TILT_STEP } from '@/utils/blackHole/constants';
import {
  INITIAL_DISTANCE,
  ORBIT_RATE,
  SLIDER_MAX,
  TILT_RATE,
  distanceToSlider,
  formatDistance,
  sliderToDistance,
} from '@/utils/experimentScale';
import styles from '@/components/sections/Experiment/Experiment.module.scss';

const experiment = experimentJson as ExperimentData;

// Pantallas pequeñas (móvil vertical o apaisado bajo): la tarjeta arranca cerrada para no tapar el
// agujero negro; se abre con el botón del ojo.
const SMALL_SCREEN = window.matchMedia('(max-width: 575.98px), (max-height: 480px)');

// Id del encabezado que nombra la sección (aria-labelledby) y de la tarjeta (aria-controls).
const TITLE_ID = 'experimentTitle';
const INFO_ID = 'experimentInfo';

// Iconos del botón de la tarjeta (decorativos: el nombre accesible lo da `aria-label`): ojo para
// mostrarla y ojo tachado para ocultarla.
const EyeIcon = () => (
  <svg viewBox='0 0 24 24' aria-hidden='true' focusable='false'>
    <path d='M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z' />
    <circle cx='12' cy='12' r='3' />
  </svg>
);
const EyeOffIcon = () => (
  <svg viewBox='0 0 24 24' aria-hidden='true' focusable='false'>
    <path d='M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z' />
    <circle cx='12' cy='12' r='3' />
    <path d='M4 4l16 16' />
  </svg>
);

export function Experiment() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fadedSentinelRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  useInView(sectionRef);
  // Sin `animation-timeline` escribe `--progress` en la sección (pausa + cola de salida); con él,
  // lo resuelve el CSS.
  useTrackProgress(sectionRef, trackRef);

  // El cálculo inicial del motor (tabla, textura, cielo) empieza cuando la sección está a ≤ 1
  // viewport de entrar, no al montar la página. Junto con la tarjeta abierta o cerrada, es el único
  // estado de React de la sección.
  const [near, setNear] = useState(false);
  const [infoOpen, setInfoOpen] = useState(() => !SMALL_SCREEN.matches);
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: '100% 0px' }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // La distancia (radios de Schwarzschild) vive en un ref y en el motor, no en estado de React: el
  // deslizante, el pellizco, `+`/`-` sobre el canvas y el motor comparten este valor.
  const distanceRef = useRef(INITIAL_DISTANCE);

  // Refleja la distancia en el deslizante y en su `aria-valuetext` (DOM directo, 0 renders).
  const showDistance = (distance: number) => {
    const slider = sliderRef.current;
    if (!slider) return;
    slider.value = String(distanceToSlider(distance));
    slider.setAttribute('aria-valuetext', formatDistance(experiment.slider.valueText, distance));
  };

  // El hint invita hasta la primera interacción con el deslizante.
  const markTouched = () => stageRef.current?.setAttribute('data-touched', 'true');

  // Al estar listo el motor, el canvas hace un fundido corto (atributo directo, sin estado) y
  // toma la distancia que haya elegido la persona mientras se calculaba.
  const { engineRef, setPaused } = useBlackHole(canvasRef, {
    enabled: near,
    initialDistance: INITIAL_DISTANCE,
    onReady: (engine) => {
      engine.distance = distanceRef.current;
      stageRef.current?.setAttribute('data-ready', 'true');
    },
    // `+`/`-` sobre el canvas: el motor ya cambió la distancia; el deslizante la sigue.
    onDistanceChange: (distance) => {
      distanceRef.current = distance;
      showDistance(distance);
      markTouched();
    },
  });

  // Al terminar la distorsión de salida el stage queda oculto: el bucle del motor se pausa (y se
  // reanuda al volver). `setPaused` es estable.
  useSectionFaded(stageRef, fadedSentinelRef, setPaused);

  const handleSlider = (event: ChangeEvent<HTMLInputElement>) => {
    const distance = sliderToDistance(Number(event.target.value));
    distanceRef.current = distance;
    const engine = engineRef.current;
    if (engine) engine.distance = distance;
    event.target.setAttribute(
      'aria-valuetext',
      formatDistance(experiment.slider.valueText, distance)
    );
    markTouched();
  };

  // Joystick en pantalla (móvil): gira e inclina la cámara sin pasar por React.
  const orbit = (azimuth: number, tilt: number) => engineRef.current?.orbitBy(azimuth, tilt);

  return (
    <section id='experiment' ref={sectionRef} aria-labelledby={TITLE_ID} className={styles.section}>
      <div ref={trackRef} className={styles.track}>
        <div ref={stageRef} className={styles.stage}>
          {/* Equivalente textual de la escena */}
          <p className={styles.summary}>{experiment.summary}</p>

          <canvas
            ref={canvasRef}
            className={styles.canvas}
            role='img'
            aria-label={experiment.canvasLabel}
            tabIndex={0}
          />

          <header className={styles.header}>
            <h2 id={TITLE_ID} className={styles.title}>
              {experiment.title}
            </h2>
            <p className={styles.subtitle}>{experiment.subtitle}</p>
          </header>

          {/* Zoom: deslizante de distancia sobre el canvas (en el móvil también se pellizca) */}
          <div className={styles.controls}>
            <p className={styles.hint}>{experiment.hint}</p>
            <label className={styles.sliderLabel}>
              <span className={styles.sliderName} aria-hidden='true'>
                {experiment.slider.label}
              </span>
              <input
                ref={sliderRef}
                className={styles.slider}
                type='range'
                min={0}
                max={SLIDER_MAX}
                step={10}
                defaultValue={distanceToSlider(INITIAL_DISTANCE)}
                aria-label={experiment.slider.label}
                aria-valuetext={formatDistance(experiment.slider.valueText, INITIAL_DISTANCE)}
                onChange={handleSlider}
              />
            </label>
          </div>

          {/* Joystick: giro horizontal e inclinación vertical (solo en pantallas táctiles) */}
          <div className={styles.joystick}>
            <Joystick
              label={experiment.controls.joystick}
              onMove={(x, y, dt) => orbit(x * ORBIT_RATE * dt, y * TILT_RATE * dt)}
              onStep={(dx, dy) => orbit(dx * ORBIT_STEP, dy * TILT_STEP)}
            />
          </div>

          {/* Tarjeta de espaguetización sobre el canvas, con un botón para ocultarla */}
          <aside className={styles.info} data-open={infoOpen}>
            <div id={INFO_ID} className={styles.card} hidden={!infoOpen}>
              <p className={styles.tidalKicker}>{experiment.tidal.kicker}</p>
              <h3 className={styles.tidalTitle}>{experiment.tidal.title}</h3>
              <p className={styles.tidalBody}>{experiment.tidal.body}</p>
            </div>
            <button
              type='button'
              className={styles.infoToggle}
              aria-expanded={infoOpen}
              aria-controls={INFO_ID}
              aria-label={infoOpen ? experiment.info.hide : experiment.info.show}
              onClick={() => setInfoOpen((open) => !open)}
            >
              {infoOpen ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </aside>

          {/* Salida: transición de estrellas de abajo hacia arriba en la cola pegajosa final */}
          <Distortion />
        </div>

        {/* Al final del track: cuando termina la cola el stage queda oculto (pausa del motor) */}
        <span ref={fadedSentinelRef} className={styles.fadedSentinel} aria-hidden='true' />
      </div>
    </section>
  );
}
