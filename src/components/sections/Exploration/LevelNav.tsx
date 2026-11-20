import { memo } from 'react';
import clsx from 'clsx';
import type { ExplorationLevel } from '@/interfaces/exploration';
import { levelLabel } from '@/utils/levelLabel';
import styles from '@/components/sections/Exploration/LevelNav.module.scss';

interface LevelNavProps {
  levels: readonly ExplorationLevel[]; // ordenados por `order`
  level: number; // nivel activo (1-4)
  onSelect: (level: number) => void;
}

// Navegación por niveles de zoom: alternativa accesible al scroll. Un botón por
// nivel e indicador continuo de progreso (lo anima el CSS con el timeline del track).
export const LevelNav = memo(function LevelNav({ levels, level, onSelect }: LevelNavProps) {
  return (
    <nav className={styles.nav} aria-label='Niveles de zoom del mapa'>
      <span className={styles.bar} aria-hidden='true'>
        <span className={styles.fill} />
      </span>
      <ul className={styles.list}>
        {levels.map((item, index) => {
          const number = index + 1;
          const active = number === level;
          return (
            <li key={item.id} className={styles.item}>
              <button
                type='button'
                className={clsx(styles.button, active && styles.active)}
                aria-label={levelLabel(number, levels.length, item.title)}
                aria-current={active ? 'step' : undefined}
                onClick={() => onSelect(number)}
              >
                {number}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});
