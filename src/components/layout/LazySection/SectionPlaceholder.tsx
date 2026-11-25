import clsx from 'clsx';
import type { Ref } from 'react';
import type { SectionId } from '@/interfaces/navigation';
import styles from '@/components/layout/LazySection/LazySection.module.scss';

interface SectionPlaceholderProps {
  id: Exclude<SectionId, 'hero'>;
  ref?: Ref<HTMLDivElement>;
}

// Ocupa el sitio de una sección sin cargar: su `id`, su altura, su solape y su punto de llegada.
export function SectionPlaceholder({ id, ref }: SectionPlaceholderProps) {
  return (
    <div ref={ref} className={clsx(styles.placeholder, styles[id])}>
      <div id={id} className={styles.body} data-arrival-pending />
      <span data-arrival={id} className={styles.arrival} aria-hidden='true' />
    </div>
  );
}
