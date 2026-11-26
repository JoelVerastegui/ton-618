import { lazy } from 'react';
import { LazySection } from '@/components/layout/LazySection/LazySection';
import { SectionMenu } from '@/components/layout/SectionMenu/SectionMenu';
import { Hero } from '@/components/sections/Hero/Hero';
import { useDirectAccess } from '@/hooks/useDirectAccess';

// Salvo el Hero, cada sección se descarga cuando hace falta (ver `LazySection`).
const Exploration = lazy(() =>
  import('@/components/sections/Exploration/Exploration').then((m) => ({ default: m.Exploration }))
);
const Science = lazy(() =>
  import('@/components/sections/Science/Science').then((m) => ({ default: m.Science }))
);
const Scale = lazy(() =>
  import('@/components/sections/Scale/Scale').then((m) => ({ default: m.Scale }))
);
const Time = lazy(() =>
  import('@/components/sections/Time/Time').then((m) => ({ default: m.Time }))
);
const Experiment = lazy(() =>
  import('@/components/sections/Experiment/Experiment').then((m) => ({ default: m.Experiment }))
);
const Evidence = lazy(() =>
  import('@/components/sections/Evidence/Evidence').then((m) => ({ default: m.Evidence }))
);
const Epilogue = lazy(() =>
  import('@/components/sections/Epilogue/Epilogue').then((m) => ({ default: m.Epilogue }))
);

// Elemento constante, y `App` sin estado: la sección activa vive en el menú, así que sus cambios no
// vuelven a renderizar las secciones.
const sections = (
  <main>
    <Hero />
    <LazySection id='exploration' component={Exploration} />
    <LazySection id='science' component={Science} />
    <LazySection id='scale' component={Scale} />
    <LazySection id='time' component={Time} />
    <LazySection id='experiment' component={Experiment} />
    <LazySection id='evidence' component={Evidence} />
    <LazySection id='epilogue' component={Epilogue} />
  </main>
);

function App() {
  // Coloca la página según la ruta de entrada
  useDirectAccess();

  return (
    <>
      <SectionMenu />
      {sections}
    </>
  );
}

export default App;
