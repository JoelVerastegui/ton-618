import { Experiment } from '@/components/sections/Experiment/Experiment';
import { Epilogue } from '@/components/sections/Epilogue/Epilogue';
import { Evidence } from '@/components/sections/Evidence/Evidence';
import { Exploration } from '@/components/sections/Exploration/Exploration';
import { Hero } from '@/components/sections/Hero/Hero';
import { Scale } from '@/components/sections/Scale/Scale';
import { Science } from '@/components/sections/Science/Science';
import { Time } from '@/components/sections/Time/Time';
import { useActiveSection } from '@/hooks/useActiveSection';
import { useDirectAccess } from '@/hooks/useDirectAccess';

// Elemento constante: cambiar la sección activa no vuelve a renderizar las secciones.
const sections = (
  <main>
    <Hero />
    <Exploration />
    <Science />
    <Scale />
    <Time />
    <Experiment />
    <Evidence />
    <Epilogue />
  </main>
);

function App() {
  // Coloca la página según la ruta de entrada
  useDirectAccess();
  // Mantiene la URL al día con la sección visible
  useActiveSection();

  return sections;
}

export default App;
