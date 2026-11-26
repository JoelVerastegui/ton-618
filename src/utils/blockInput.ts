// Impide que la persona mueva la página, active controles o cambie el foco (rueda, táctil, teclado y
// clic).
// Los atajos del navegador (con Ctrl, Alt o Meta, y las teclas de función) siguen funcionando.
// Devuelve cómo quitar el bloqueo.
export function blockInput() {
  const controller = new AbortController();
  const options = { capture: true, passive: false, signal: controller.signal };

  const block = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  const blockKey = (event: KeyboardEvent) => {
    const shortcut = event.ctrlKey || event.metaKey || event.altKey || /^F\d+$/.test(event.key);
    if (!shortcut) block(event);
  };

  for (const type of ['wheel', 'touchmove', 'mousedown', 'click']) {
    window.addEventListener(type, block, options);
  }
  window.addEventListener('keydown', blockKey, options);

  return () => controller.abort();
}
