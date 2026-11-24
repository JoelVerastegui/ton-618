import { useId, useState } from 'react';
import clsx from 'clsx';
import type { EvidenceQuestion } from '@/interfaces/evidence';
import styles from '@/components/sections/Evidence/Questions.module.scss';

interface QuestionsProps {
  items: EvidenceQuestion[];
}

// Acordeón de una sola pregunta abierta. El único estado es el índice abierto (o ninguno). Las
// respuestas siempre están en el DOM: cerradas solo se reducen visualmente.
export function Questions({ items }: QuestionsProps) {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className={styles.list}>
      {items.map((item, index) => {
        const isOpen = open === index;
        const buttonId = `${baseId}-button-${index}`;
        const panelId = `${baseId}-panel-${index}`;

        return (
          <div key={item.question} className={clsx(styles.item, isOpen && styles.open)}>
            <h3 className={styles.heading}>
              <button
                id={buttonId}
                type='button'
                className={styles.button}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : index)}
              >
                <span className={styles.question}>{item.question}</span>
                <svg className={styles.chevron} viewBox='0 0 24 24' aria-hidden='true'>
                  <path d='M6 9l6 6 6-6' />
                </svg>
              </button>
            </h3>
            <div id={panelId} role='region' aria-labelledby={buttonId} className={styles.panel}>
              <p className={styles.verdict}>{item.verdict}</p>
              <p className={styles.answer}>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
