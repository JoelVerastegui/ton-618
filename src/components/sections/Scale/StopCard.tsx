import type { ScaleStop } from '@/interfaces/scale';
import styles from '@/components/sections/Scale/StopCard.module.scss';

// Tarjeta de la parada activa. Se monta con `key` por parada: nunca hay dos a la vez.
export function StopCard({ stop }: { stop: ScaleStop }) {
  return (
    <article className={styles.card}>
      <p className={styles.kicker}>{stop.kicker}</p>
      <h3 className={styles.title}>{stop.title}</h3>
      <p className={styles.size}>{stop.size}</p>
      <p className={styles.answer}>{stop.answer}</p>
    </article>
  );
}
