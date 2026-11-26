import navigationJson from '@/data/navigation.json';
import type { NavigationData, SectionId } from '@/interfaces/navigation';

const { links } = navigationJson as NavigationData;
const BASE = import.meta.env.BASE_URL;

// Ruta completa (con la base) de una sección.
export const sectionPath = (id: SectionId): string =>
  BASE + (links.find((link) => link.id === id)?.path ?? '');

// Sección de una ruta, con o sin barra final. `null` si la ruta no es de ninguna.
export const sectionFromPath = (pathname: string): SectionId | null => {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  if (!path.startsWith(BASE)) return null;

  const relative = path.slice(BASE.length).replace(/\/$/, '');
  return links.find((link) => link.path === relative)?.id ?? null;
};
