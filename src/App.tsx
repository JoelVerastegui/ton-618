import { Experiment } from '@/components/sections/Experiment/Experiment';
import { Evidence } from '@/components/sections/Evidence/Evidence';
import { Exploration } from '@/components/sections/Exploration/Exploration';
import { Hero } from '@/components/sections/Hero/Hero';
import { Scale } from '@/components/sections/Scale/Scale';
import { Science } from '@/components/sections/Science/Science';
import { Time } from '@/components/sections/Time/Time';

function App() {
  return (
    <main>
      <Hero />
      <Exploration />
      <Science />
      <Scale />
      <Time />
      <Experiment />
      <Evidence />
    </main>
  );
}

export default App;
