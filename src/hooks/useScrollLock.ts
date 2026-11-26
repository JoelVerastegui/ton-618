import { useLayoutEffect } from 'react';

// Atributo de `<html>` con el que `main.scss` impide el scroll de la persona.
const ATTRIBUTE = 'data-scroll-lock';
// Ancho que ocupaba la barra de scroll: lo usan `main.scss` y el menú para que nada se mueva.
const WIDTH_PROPERTY = '--scrollbarWidth';

/**
 * Bloquea el scroll de fondo (rueda, táctil y teclado) mientras `locked` sea `true`. No mueve la
 * página: la posición, los stages `sticky` y las animaciones por scroll no cambian.
 */
export function useScrollLock(locked: boolean) {
  // Layout effect: con `flushSync`, el bloqueo se quita antes de la siguiente instrucción
  useLayoutEffect(() => {
    if (!locked) return;

    const root = document.documentElement;
    // Se mide antes de ocultarla; 0 con barras superpuestas (móviles)
    const width = Math.max(0, window.innerWidth - root.clientWidth);
    root.style.setProperty(WIDTH_PROPERTY, `${width}px`);
    root.setAttribute(ATTRIBUTE, '');
    // El ancho se queda: el menú aún lo usa mientras sale
    return () => root.removeAttribute(ATTRIBUTE);
  }, [locked]);
}
