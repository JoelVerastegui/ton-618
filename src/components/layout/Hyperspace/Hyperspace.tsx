import { useEffect, useRef } from 'react';
import styles from '@/components/layout/Hyperspace/Hyperspace.module.scss';
import type { Transition } from '@/interfaces/navigation';

interface HyperspaceProps extends Transition {
  onPhaseEnd: () => void;
}

// Salto hiperespacial: un telón de estrellas estiradas que cubre la pantalla (`in`) y la descubre
// (`out`) en la dirección del viaje. Avisa al terminar cada fase; las duraciones son del SCSS.
export function Hyperspace({ direction, phase, onPhaseEnd }: HyperspaceProps) {
  const veilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let frame = 0;
    // Sin animaciones (p. ej. anuladas desde fuera) el telón ya cubre y la fase acaba al momento
    const animations = veilRef.current!.getAnimations();

    Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (!active) return;
      if (phase === 'out') return onPhaseEnd();
      // Dos fotogramas: la pantalla ya se ha pintado cubierta antes de saltar
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(onPhaseEnd);
      });
    });

    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [phase, onPhaseEnd]);

  return (
    <div
      className={styles.hyperspace}
      data-direction={direction}
      data-phase={phase}
      aria-hidden='true'
    >
      <div ref={veilRef} className={styles.veil}>
        <div className={styles.streaks}>
          <span className={styles.far} />
          <span className={styles.near} />
        </div>
      </div>
    </div>
  );
}
