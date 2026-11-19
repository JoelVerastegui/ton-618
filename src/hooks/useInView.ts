import { useEffect, type RefObject } from 'react';

/**
 * Marca el elemento con `data-inview="true" | "false"` según esté o no en el
 * viewport. Escribe el atributo directamente en el DOM (sin estado de React)
 * para que el CSS pueda pausar animaciones cuando el elemento queda fuera de
 * vista.
 */
export function useInView(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      element.dataset.inview = String(entry.isIntersecting);
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      delete element.dataset.inview;
    };
  }, [ref]);
}
