import styles from '@/components/ui/Distortion/Distortion.module.scss';

/**
 * Telón de la transición entre secciones (SPEC 06): un fondo oscuro con estrellas lejanas, medias y
 * cercanas y algo de nebulosa (en blanco y negro, en la capa de las lejanas) que sube desde abajo y
 * cubre el stage. Decorativo y sin estado: el CSS lo anima con el `view-timeline` del track de la
 * sección que lo contiene (que fija `--distortTimeline`, `--distortFrom` y `--distortTo`; ver
 * `styles/_distortion.scss`). Va al final del stage.
 */
export function Distortion() {
  return (
    <div className={styles.distortion} aria-hidden='true'>
      <div className={styles.cover}>
        <span className={`${styles.layer} ${styles.far}`} />
        <span className={`${styles.layer} ${styles.mid}`} />
        <span className={`${styles.layer} ${styles.near}`} />
      </div>
    </div>
  );
}
