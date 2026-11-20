import type { ReactNode } from 'react';
import clsx from 'clsx';
import type { ExplorationLevelId } from '@/interfaces/exploration';
import motion from '@/components/sections/Exploration/Layers/LayerMotion.module.scss';
import shared from '@/components/sections/Exploration/Layers/LayerShared.module.scss';

export type LayerVariant = 'universe' | 'neighborhood' | 'sky' | 'ton';

interface LayerProps {
  levelId: ExplorationLevelId;
  variant: LayerVariant;
  children: ReactNode;
}

// Contenedor de una capa del mapa: posición, estado base y zoom por scroll.
export function Layer({ levelId, variant, children }: LayerProps) {
  return (
    <div className={clsx(motion.layer, motion[variant])} data-level-id={levelId}>
      {children}
    </div>
  );
}

interface LayerSvgProps {
  className?: string;
  children: ReactNode;
}

// Cada capa dibuja en su propio <svg viewBox="0 0 1000 1000">, decorativo.
export function LayerSvg({ className, children }: LayerSvgProps) {
  return (
    <svg
      className={clsx(shared.svg, className)}
      viewBox='0 0 1000 1000'
      aria-hidden='true'
      focusable={false}
    >
      {children}
    </svg>
  );
}
