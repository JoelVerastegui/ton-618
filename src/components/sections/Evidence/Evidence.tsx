import { Compare } from '@/components/sections/Evidence/Compare';
import { Questions } from '@/components/sections/Evidence/Questions';
import evidenceJson from '@/data/evidence.json';
import type { EvidenceData } from '@/interfaces/evidence';
import styles from '@/components/sections/Evidence/Evidence.module.scss';

const evidence = evidenceJson as EvidenceData;

// Id del encabezado que nombra la sección (aria-labelledby).
const TITLE_ID = 'evidenceTitle';

export function Evidence() {
  return (
    <div className={styles.tail}>
      <section id='evidence' aria-labelledby={TITLE_ID} className={styles.section}>
        {/* Cielo decorativo: el mismo del telón de la transición de Experimento */}
        <div className={styles.sky} aria-hidden='true'>
          <span className={`${styles.layer} ${styles.far}`} />
          <span className={`${styles.layer} ${styles.mid}`} />
          <span className={`${styles.layer} ${styles.near}`} />
          <span className={`${styles.layer} ${styles.nebula}`} />
        </div>

        <p className={styles.summary}>{evidence.summary}</p>

        <header className={styles.header}>
          <h2 id={TITLE_ID} className={styles.title}>
            {evidence.title}
          </h2>
          <p className={styles.subtitle}>{evidence.subtitle}</p>
        </header>

        <div className={styles.compare}>
          <Compare hint={evidence.hint} data={evidence.compare} />
        </div>
        <div className={styles.questions}>
          <Questions items={evidence.questions} />
        </div>
      </section>
      <span data-arrival='evidence' className={styles.arrival} aria-hidden='true' />
    </div>
  );
}
