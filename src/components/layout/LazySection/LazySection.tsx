import { Suspense, useEffect, useRef, useSyncExternalStore, type ComponentType } from 'react';
import { SectionBoundary } from '@/components/layout/LazySection/SectionBoundary';
import { SectionPlaceholder } from '@/components/layout/LazySection/SectionPlaceholder';
import type { SectionId } from '@/interfaces/navigation';
import {
  isRequested,
  requestSection,
  sectionMounted,
  subscribeSections,
} from '@/utils/sectionLoader';

// La sección se pide cuando su marcador está a menos de dos alturas de viewport.
const LOAD_MARGIN = '200% 0px';

interface LazySectionProps {
  id: Exclude<SectionId, 'hero'>;
  component: ComponentType; // creado con `React.lazy`
}

// Va junto a la sección dentro de `Suspense`: su efecto corre cuando la sección ya está montada.
function Mounted({ id }: { id: SectionId }) {
  useEffect(() => sectionMounted(id), [id]);
  return null;
}

export function LazySection({ id, component: Section }: LazySectionProps) {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const requested = useSyncExternalStore(subscribeSections, () => isRequested(id));

  useEffect(() => {
    const placeholder = placeholderRef.current;
    if (requested || !placeholder) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) requestSection(id);
      },
      { rootMargin: LOAD_MARGIN }
    );
    observer.observe(placeholder);
    return () => observer.disconnect();
  }, [id, requested]);

  if (!requested) return <SectionPlaceholder ref={placeholderRef} id={id} />;

  const fallback = <SectionPlaceholder id={id} />;
  return (
    <SectionBoundary id={id} fallback={fallback}>
      <Suspense fallback={fallback}>
        <Section />
        <Mounted id={id} />
      </Suspense>
    </SectionBoundary>
  );
}
