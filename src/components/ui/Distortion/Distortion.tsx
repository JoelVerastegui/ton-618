import styles from '@/components/ui/Distortion/Distortion.module.scss';

/**
 * Capas de la distorsión de transición (SPEC 06): tres anillos concéntricos, estrías radiales y un
 * velo que parten del centro del stage. Decorativas y sin estado: el CSS las anima con el
 * `view-timeline` del track de la sección que las contiene (que fija `--distortTimeline`,
 * `--distortFrom` y `--distortTo`; ver `styles/_distortion.scss`). Va al final del stage.
 */
export function Distortion() {
  return (
    <div className={styles.distortion} aria-hidden='true'>
      <span className={`${styles.ring} ${styles.ringA}`} />
      <span className={`${styles.ring} ${styles.ringB}`} />
      <span className={`${styles.ring} ${styles.ringC}`} />
      <span className={styles.streaks} />
      <span className={styles.veil} />
    </div>
  );
}
