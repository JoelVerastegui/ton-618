import { memo } from 'react';
import { BlackHoleField } from '@/components/sections/Exploration/Layers/BlackHoleField';
import { Overlays } from '@/components/sections/Science/Overlays';
import quasar from '@/assets/images/science/quasar-1536.webp';
import styles from '@/components/sections/Science/Science.module.scss';

// Visor circular: capa de entrada (último fotograma de Exploración, sin centelleo) y
// cámara con la ilustración del cuásar. No depende del estado: un clic no lo vuelve a
// renderizar (la cámara se mueve por `data-point` en la sección).
export const Viewer = memo(function Viewer() {
  return (
    <div className={styles.viewer} aria-hidden='true'>
      <div className={styles.entry}>
        <BlackHoleField twinkle={false} />
      </div>
      <div className={styles.camera}>
        <img
          className={styles.quasar}
          src={quasar}
          alt=''
          width={1536}
          height={1536}
          decoding='async'
        />
        <Overlays />
      </div>
    </div>
  );
});
