// Anima un valor de `from` a `to` en `duration` ms con smoothstep, llamando a `onUpdate` en cada
// fotograma. Devuelve la función que cancela la animación (sin llamar a `onUpdate` otra vez).
export function animateValue(
  from: number,
  to: number,
  duration: number,
  onUpdate: (value: number) => void
): () => void {
  const start = performance.now();
  let frameId = 0;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    onUpdate(from + (to - from) * (t * t * (3 - 2 * t)));
    if (t < 1) frameId = requestAnimationFrame(tick);
  };
  frameId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frameId);
}
