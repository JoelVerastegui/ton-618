import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useBlackHole } from '@/hooks/useBlackHole';
import { useInView } from '@/hooks/useInView';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import experimentJson from '@/data/experiment.json';
import type { ExperimentData } from '@/interfaces/experiment';
import {
  INITIAL_DISTANCE,
  SLIDER_MAX,
  distanceToSlider,
  formatDistance,
  sliderToDistance,
  tidalAmount,
} from '@/utils/experimentScale';
import { animateValue } from '@/utils/animateValue';
import { getRayDiagram } from '@/utils/rayDiagram';
import styles from '@/components/sections/Experiment/Experiment.module.scss';

const experiment = experimentJson as ExperimentData;

// Id del encabezado que nombra la sección (aria-labelledby).
const TITLE_ID = 'experimentTitle';

// Duración de la aparición de la cuadrícula (ms)
const GRID_FADE_MS = 600;

export function Experiment() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const tidalRef = useRef<HTMLElement>(null);
  const raySvgRef = useRef<SVGSVGElement>(null);
  const rayStraightRef = useRef<SVGPathElement>(null);
  const rayBentRef = useRef<SVGPathElement>(null);
  const rayCameraRef = useRef<SVGPathElement>(null);
  useInView(sectionRef);
  const reducedMotion = useReducedMotion();

  // Los dos conmutadores son el único estado de React de la sección.
  const [gridOn, setGridOn] = useState(false);
  const [rayOn, setRayOn] = useState(false);
  // Valor de `gridAmount` que corresponde al conmutador (el motor puede no estar listo aún).
  const gridTargetRef = useRef(0);

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

  // Dibuja el diagrama del rayo para la distancia de la cámara. La trayectoria sale de una caché
  // por distancia redondeada; solo se escriben atributos (DOM directo, 0 renders).
  const showRay = (distance: number) => {
    const diagram = getRayDiagram(distance);
    raySvgRef.current?.setAttribute('viewBox', diagram.viewBox);
    rayStraightRef.current?.setAttribute('d', diagram.straight);
    rayBentRef.current?.setAttribute('d', diagram.bent);
    rayCameraRef.current?.setAttribute('d', diagram.camera);
  };
  // Escribe `--tidal` (0…1) directamente en la tarjeta: el CSS la deforma con `transform`. Con
  // reduced-motion no se escribe y la tarjeta no se deforma.
  const showTidal = (distance: number) => {
    tidalRef.current?.style.setProperty(
      '--tidal',
      reducedMotion ? '0' : String(tidalAmount(distance))
    );
  };

  useEffect(() => {
    showRay(INITIAL_DISTANCE);
  }, []);

  // Refleja la distancia en el deslizante y en su `aria-valuetext` (DOM directo, 0 renders).
  const showDistance = (distance: number) => {
    const slider = sliderRef.current;
    if (!slider) return;
    slider.value = String(distanceToSlider(distance));
    slider.setAttribute('aria-valuetext', formatDistance(experiment.slider.valueText, distance));
    showRay(distance);
    showTidal(distance);
  };

  // Al estar listo el motor, el canvas hace un fundido corto (atributo directo, sin estado) y
  // toma la distancia que haya elegido la persona mientras se calculaba.
  const { engineRef } = useBlackHole(canvasRef, {
    enabled: near,
    initialDistance: INITIAL_DISTANCE,
    onReady: (engine) => {
      engine.distance = distanceRef.current;
      engine.gridAmount = gridTargetRef.current;
      stageRef.current?.setAttribute('data-ready', 'true');
    },
    // `+`/`-` sobre el canvas: el motor ya cambió la distancia; el deslizante la sigue.
    onDistanceChange: (distance) => {
      distanceRef.current = distance;
      showDistance(distance);
    },
  });

  // «Cuadrícula»: `gridAmount` sube de 0 a 1 (y baja) de forma suave; con reduced-motion cambia
  // sin interpolar.
  useEffect(() => {
    const target = gridOn ? 1 : 0;
    gridTargetRef.current = target;
    const engine = engineRef.current;
    if (!engine) return;
    if (reducedMotion) {
      engine.gridAmount = target;
      return;
    }
    return animateValue(engine.gridAmount, target, GRID_FADE_MS, (value) => {
      engine.gridAmount = value;
    });
  }, [gridOn, reducedMotion, engineRef]);

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
    showRay(distance);
    showTidal(distance);
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
            <button
              type='button'
              className={styles.toggle}
              aria-pressed={gridOn}
              onClick={() => setGridOn((on) => !on)}
            >
              {experiment.grid.label}
            </button>
            <button
              type='button'
              className={styles.toggle}
              aria-pressed={rayOn}
              onClick={() => setRayOn((on) => !on)}
            >
              {experiment.ray.label}
            </button>
          </div>
        </div>

        {/* Diagrama 2D del plano del rayo: la cámara a la distancia actual, el agujero negro de radio
            1 y dos trazos con el mismo parámetro de impacto. Decorativo: lo explica el `summary`. */}
        <div className={styles.side}>
          <div className={styles.ray} data-on={rayOn} aria-hidden='true'>
            <svg ref={raySvgRef} className={styles.raySvg} preserveAspectRatio='xMidYMid meet'>
              <circle className={styles.rayHole} cx={0} cy={0} r={1} />
              <path ref={rayStraightRef} className={styles.rayStraight} />
              <path ref={rayBentRef} className={styles.rayBent} />
              <path ref={rayCameraRef} className={styles.rayCamera} />
            </svg>
            <ul className={styles.rayLegend}>
              <li className={styles.rayLegendStraight}>{experiment.rayLegend.straight}</li>
              <li className={styles.rayLegendBent}>{experiment.rayLegend.bent}</li>
            </ul>
          </div>

          <aside ref={tidalRef} className={styles.tidal}>
            <p className={styles.tidalKicker}>{experiment.tidal.kicker}</p>
            <h3 className={styles.tidalTitle}>{experiment.tidal.title}</h3>
            <p className={styles.tidalBody}>{experiment.tidal.body}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
