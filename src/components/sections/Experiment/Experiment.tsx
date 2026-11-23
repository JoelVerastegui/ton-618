import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useBlackHole } from '@/hooks/useBlackHole';
import { useInView } from '@/hooks/useInView';
import experimentJson from '@/data/experiment.json';
import type { ExperimentData } from '@/interfaces/experiment';
import {
  INITIAL_DISTANCE,
  SLIDER_MAX,
  distanceToSlider,
  formatDistance,
  sliderToDistance,
} from '@/utils/experimentScale';
import styles from '@/components/sections/Experiment/Experiment.module.scss';

const experiment = experimentJson as ExperimentData;

// Id del encabezado que nombra la sección (aria-labelledby).
const TITLE_ID = 'experimentTitle';

export function Experiment() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  useInView(sectionRef);

  // El cálculo inicial del motor (tabla, textura, cielo) empieza cuando la sección está a ≤ 1
  // viewport de entrar, no al montar la página.
  const [near, setNear] = useState(false);
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
  // deslizante, `+`/`-` sobre el canvas y el motor comparten este único valor.
  const distanceRef = useRef(INITIAL_DISTANCE);

  // Refleja la distancia en el deslizante y en su `aria-valuetext` (DOM directo, 0 renders).
  const showDistance = (distance: number) => {
    const slider = sliderRef.current;
    if (!slider) return;
    slider.value = String(distanceToSlider(distance));
    slider.setAttribute('aria-valuetext', formatDistance(experiment.slider.valueText, distance));
  };

  // Al estar listo el motor, el canvas hace un fundido corto (atributo directo, sin estado) y
  // toma la distancia que haya elegido la persona mientras se calculaba.
  const { engineRef } = useBlackHole(canvasRef, {
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
    },
  });

  const handleSlider = (event: ChangeEvent<HTMLInputElement>) => {
    const distance = sliderToDistance(Number(event.target.value));
    distanceRef.current = distance;
    const engine = engineRef.current;
    if (engine) {
      engine.distance = distance;
      engine.touch();
    }
    event.target.setAttribute(
      'aria-valuetext',
      formatDistance(experiment.slider.valueText, distance)
    );
    // El hint invita hasta la primera interacción con el deslizante.
    stageRef.current?.setAttribute('data-touched', 'true');
  };

  return (
    <section id='experiment' ref={sectionRef} aria-labelledby={TITLE_ID} className={styles.section}>
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

        <div className={styles.controls}>
          <p className={styles.hint}>{experiment.hint}</p>
          <label className={styles.sliderLabel}>
            <span className={styles.sliderName}>{experiment.slider.label}</span>
            <input
              ref={sliderRef}
              className={styles.slider}
              type='range'
              min={0}
              max={SLIDER_MAX}
              step={1}
              defaultValue={distanceToSlider(INITIAL_DISTANCE)}
              aria-valuetext={formatDistance(experiment.slider.valueText, INITIAL_DISTANCE)}
              onChange={handleSlider}
            />
          </label>
          <div className={styles.toggles}>
            <button type='button' className={styles.toggle} aria-pressed='false'>
              {experiment.grid.label}
            </button>
            <button type='button' className={styles.toggle} aria-pressed='false'>
              {experiment.ray.label}
            </button>
          </div>
        </div>

        <aside className={styles.tidal}>
          <p className={styles.tidalKicker}>{experiment.tidal.kicker}</p>
          <h3 className={styles.tidalTitle}>{experiment.tidal.title}</h3>
          <p className={styles.tidalBody}>{experiment.tidal.body}</p>
        </aside>
      </div>
    </section>
  );
}
