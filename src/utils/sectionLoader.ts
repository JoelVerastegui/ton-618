import navigationJson from '@/data/navigation.json';
import type { NavigationData, SectionId } from '@/interfaces/navigation';

// Estado de carga de las secciones: quién pide cada una (la cercanía de su marcador de posición o
// una navegación) y cuándo está montada. Una sección pedida no se vuelve a descargar ni se desmonta.

const { links } = navigationJson as NavigationData;

interface SectionLoad {
  promise: Promise<void>; // se resuelve al montarse la sección; se rechaza si falla su descarga
  resolve: () => void;
  reject: (error: unknown) => void;
}

const loads = new Map<SectionId, SectionLoad>();
const listeners = new Set<() => void>();
let version = 0; // cambia cada vez que se sustituye el marcado de una sección

const notify = () => {
  version++;
  listeners.forEach((listener) => listener());
};

const createLoad = (): SectionLoad => {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  // Sin nadie esperando (carga por cercanía), un fallo no es un rechazo sin manejar
  promise.catch(() => {});
  return { promise, resolve, reject };
};

export const subscribeSections = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const isRequested = (id: SectionId) => loads.has(id);

export const getSectionsVersion = () => version;

// Pide una sección. El Hero se carga con la página: ya está montado.
export const requestSection = (id: SectionId): Promise<void> => {
  if (id === 'hero') return Promise.resolve();

  let load = loads.get(id);
  if (!load) {
    load = createLoad();
    loads.set(id, load);
    notify();
  }
  return load.promise;
};

export const sectionMounted = (id: SectionId) => {
  loads.get(id)?.resolve();
  notify();
};

export const sectionFailed = (id: SectionId, error: unknown) => {
  loads.get(id)?.reject(error);
  notify();
};

// La sección y sus vecinas: lo que hace falta para medir su punto de llegada y no ver huecos.
export const neighborhood = (id: SectionId): SectionId[] => {
  const index = links.findIndex((link) => link.id === id);
  return links.slice(Math.max(0, index - 1), index + 2).map((link) => link.id);
};

export const loadSections = (ids: SectionId[]) => Promise.all(ids.map(requestSection));
