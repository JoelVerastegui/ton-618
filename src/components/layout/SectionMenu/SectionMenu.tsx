import { useLayoutEffect, useRef, useState, type MouseEvent, type SyntheticEvent } from 'react';
import { flushSync } from 'react-dom';
import clsx from 'clsx';
import styles from '@/components/layout/SectionMenu/SectionMenu.module.scss';
import { Icon } from '@/components/ui/Icon/Icon';
import navigationJson from '@/data/navigation.json';
import { useActiveSection } from '@/hooks/useActiveSection';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useSectionNavigation } from '@/hooks/useSectionNavigation';
import type { NavigationData, SectionId } from '@/interfaces/navigation';
import { continueTabFrom } from '@/utils/continueTabFrom';
import { sectionPath } from '@/utils/routes';
import { cancelScrollAnimations } from '@/utils/scrollAnimations';

const { menuLabel, openLabel, closeLabel, links } = navigationJson as NavigationData;

// Ícono fijo y menú lateral. Aquí vive la sección activa: al cambiar solo se renderiza el menú.
export function SectionMenu() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Además de marcar su enlace, mantiene la URL al día con la sección visible
  const active = useActiveSection();
  const { navigate } = useSectionNavigation();
  useScrollLock(open);

  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    if (dialog.open === open) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
      toggleRef.current?.focus({ preventScroll: true });
    }
  }, [open]);

  const openMenu = () => {
    cancelScrollAnimations();
    setOpen(true);
  };
  const closeMenu = () => setOpen(false);

  // `Escape` pasa por el estado, como los demás cierres: el evento `close` llega más tarde y
  // anularía una reapertura inmediata
  const handleCancel = (event: SyntheticEvent) => {
    event.preventDefault();
    closeMenu();
  };

  // Cierre que impone el navegador sin dejar cancelarlo (p. ej. un segundo `Escape` seguido)
  const handleClose = () => {
    if (dialogRef.current?.open) return;
    closeMenu();
    toggleRef.current?.focus({ preventScroll: true });
  };

  const follow = (event: MouseEvent, id: SectionId) => {
    // Con modificadores, el navegador abre el enlace a su manera
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    // El menú se cierra y suelta el scroll antes de saltar
    flushSync(closeMenu);
    navigate(id);
  };

  return (
    <header>
      <button
        ref={toggleRef}
        type='button'
        className={clsx(styles.control, styles.toggle)}
        aria-label={openLabel}
        aria-haspopup='dialog'
        aria-expanded={open}
        onClick={openMenu}
        // El ícono va antes que la página: sin esto, `Tab` volvería al principio desde cualquier punto
        onKeyDown={(event) => event.key === 'Tab' && !event.shiftKey && continueTabFrom(active)}
      >
        <Icon id='menu-icon' />
      </button>

      {/* El clic que llega al propio diálogo es fuera del panel. `Escape` es solo del menú: no
          cierra además lo que haya abierto en la página. */}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label={menuLabel}
        onCancel={handleCancel}
        onClose={handleClose}
        onClick={(event) => event.target === event.currentTarget && closeMenu()}
        onKeyDown={(event) => event.key === 'Escape' && event.stopPropagation()}
      >
        <div className={clsx('d-flex flex-column h-100', styles.panel)}>
          <button
            type='button'
            className={clsx('align-self-end flex-shrink-0', styles.control, styles.close)}
            aria-label={closeLabel}
            onClick={closeMenu}
          >
            <Icon id='close-icon' />
          </button>

          <nav
            className={clsx('d-flex flex-column flex-grow-1', styles.nav)}
            aria-label={menuLabel}
          >
            <ul className={clsx('list-unstyled w-100 my-auto', styles.list)}>
              {links.map(({ id, label }) => (
                <li key={id}>
                  <a
                    className={clsx('d-flex align-items-center gap-3', styles.link)}
                    href={sectionPath(id)}
                    aria-current={id === active ? 'location' : undefined}
                    onClick={(event) => follow(event, id)}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </dialog>
    </header>
  );
}
