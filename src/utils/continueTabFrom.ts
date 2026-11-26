import type { SectionId } from '@/interfaces/navigation';

/**
 * Hace que la tabulación siga desde una sección: la enfoca sin mover la página, y el `Tab` en curso
 * pasa a su primer control (o al siguiente de la página, si no tiene ninguno).
 */
export function continueTabFrom(id: SectionId) {
  const section = document.getElementById(id);
  if (!section) return;

  section.tabIndex = -1; // enfocable solo durante este paso
  section.addEventListener('blur', () => section.removeAttribute('tabindex'), { once: true });
  section.focus({ preventScroll: true });
}
