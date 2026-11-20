import { memo } from 'react';
import clsx from 'clsx';
import { CENTER } from '@/utils/geometry';
import { DISK_RATIO, DISK_RINGS, HORIZON_RADIUS, LENS_ARCS } from '@/utils/quasarOverlays';
import styles from '@/components/sections/Science/Overlays.module.scss';

// Escala inversa de las partículas: el grupo estático aplasta el plano del disco y esto
// las deja redondas.
const UNSQUASH = `scale(1 ${+(1 / DISK_RATIO).toFixed(2)})`;

// Superposiciones de cada punto, dentro de la cámara (misma transform que la imagen).
// Cada capa solo es visible (y solo anima) con su punto activo (`data-point` en la sección).
export const Overlays = memo(function Overlays() {
  return (
    <svg className={styles.overlays} viewBox='0 0 1000 1000' aria-hidden='true' focusable={false}>
      <defs>
        <linearGradient
          id='lensFade'
          gradientUnits='userSpaceOnUse'
          x1='430'
          x2='570'
          y1='0'
          y2='0'
        >
          <stop className={styles.lensStop} offset='0' stopOpacity='0' />
          <stop className={styles.lensStop} offset='0.3' stopOpacity='1' />
          <stop className={styles.lensStop} offset='0.7' stopOpacity='1' />
          <stop className={styles.lensStop} offset='1' stopOpacity='0' />
        </linearGradient>
      </defs>

      <g className={clsx(styles.layer, styles.horizon)}>
        <g className={styles.horizonSpin}>
          <circle className={styles.horizonRing} cx={CENTER} cy={CENTER} r={HORIZON_RADIUS} />
        </g>
      </g>

      <g className={clsx(styles.layer, styles.disk)}>
        <g transform={`translate(${CENTER} ${CENTER}) scale(1 ${DISK_RATIO})`}>
          {DISK_RINGS.map((ring) => (
            <g key={ring.id} className={clsx(styles.ring, styles[ring.id])}>
              {ring.particles.map((p) => (
                <circle
                  key={`${p.x}:${p.y}`}
                  className={styles.particle}
                  r={2.6}
                  transform={`translate(${p.x} ${p.y}) ${UNSQUASH}`}
                />
              ))}
            </g>
          ))}
        </g>
      </g>

      <g className={clsx(styles.layer, styles.lens)}>
        <g className={styles.lensPulse}>
          {LENS_ARCS.map((d) => (
            <path key={d} className={styles.lensArc} d={d} />
          ))}
        </g>
      </g>
    </svg>
  );
});
