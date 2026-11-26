// Indica si hay una navegación por menú en curso. Es síncrono: quien detecta la sección activa lo
// consulta antes de que React vuelva a renderizar.
let navigating = false;
const listeners = new Set<() => void>();

export const isNavigating = () => navigating;

export const setNavigating = (value: boolean) => {
  navigating = value;
  listeners.forEach((listener) => listener());
};

export const subscribeNavigation = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
