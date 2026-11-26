// Registro de los scrolls animados en curso, para poder cancelarlos desde fuera.
const running = new Set<() => void>();

// Anota el scroll animado que se detiene con `stop`; devuelve cómo darlo de baja.
export const trackScrollAnimation = (stop: () => void) => {
  running.add(stop);
  return () => {
    running.delete(stop);
  };
};

export const cancelScrollAnimations = () => running.forEach((stop) => stop());
