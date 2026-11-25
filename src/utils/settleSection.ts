import type { SectionId } from '@/interfaces/navigation';

// Tope de espera: pasado, se sigue aunque el destino no esté completo.
const TIMEOUT_MS = 8000;

const nextFrame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));

// Dos fotogramas: los `IntersectionObserver` avisan y React aplica el estado resultante.
const twoFrames = () => nextFrame().then(nextFrame);

const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

// Una sección que aún no puede mostrarse completa lleva `data-arrival-pending`.
const isPending = (section: Element) =>
  section.matches('[data-arrival-pending]') ||
  section.querySelector('[data-arrival-pending]') !== null;

const isOnScreen = (element: Element) => {
  const { width, height, top, right, bottom, left } = element.getBoundingClientRect();
  return (
    width > 0 && height > 0 && bottom > 0 && right > 0 && top < innerHeight && left < innerWidth
  );
};

// Fuentes, imágenes y pósteres de vídeo en pantalla, ya decodificados (un fallo no bloquea).
const loadVisibleMedia = (section: Element) => {
  const media = section.querySelectorAll<HTMLImageElement | HTMLVideoElement>('img, video[poster]');
  const images = [...media].filter(isOnScreen).map((element) => {
    if (element instanceof HTMLImageElement) return element;
    const poster = new Image();
    poster.src = element.poster;
    return poster;
  });

  return Promise.all([
    document.fonts.ready,
    ...images.map((image) => image.decode().catch(() => {})),
  ]);
};

// Lleva a su final las animaciones y transiciones finitas basadas en tiempo. Las guiadas por scroll
// (otro `timeline`) y las infinitas no se tocan.
const finishEntrances = (section: Element) => {
  for (const animation of section.getAnimations({ subtree: true })) {
    if (animation.timeline !== document.timeline) continue;
    if (animation.effect?.getComputedTiming().endTime === Infinity) continue;
    animation.finish();
  }
};

/**
 * Tras saltar a una sección: espera a que esté lista (sin `data-arrival-pending`, con fuentes e
 * imágenes visibles decodificadas; tope de 8 s) y completa sus animaciones de entrada.
 */
export async function settleSection(id: SectionId): Promise<void> {
  const section = document.getElementById(id);
  if (!section) return;
  const deadline = performance.now() + TIMEOUT_MS;

  await twoFrames();
  finishEntrances(section); // lo que ya arrancó no se ve a medias durante la espera

  while (isPending(section) && performance.now() < deadline) await nextFrame();
  await Promise.race([loadVisibleMedia(section), delay(deadline - performance.now())]);

  // Dos pasadas: lo que acaba de quedar listo puede arrancar otra animación
  for (let pass = 0; pass < 2; pass++) {
    await twoFrames();
    finishEntrances(section);
  }
}
