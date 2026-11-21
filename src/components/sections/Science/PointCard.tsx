import type { SciencePoint } from '@/interfaces/science';
import { cardTitleId } from '@/utils/cardTitleId';
import styles from '@/components/sections/Science/PointCard.module.scss';

// Tarjeta del punto activo: kicker, título (recibe el foco al abrir) y respuesta.
export function PointCard({ point }: { point: SciencePoint }) {
  return (
    <article className={styles.card} aria-labelledby={cardTitleId(point.id)}>
      <p className={styles.kicker}>{point.kicker}</p>
      <h3 id={cardTitleId(point.id)} className={styles.title} tabIndex={-1}>
        {point.title}
      </h3>
      <p className={styles.answer}>{point.answer}</p>
    </article>
  );
}
