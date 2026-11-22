import { memo, useRef, type RefObject } from 'react';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';
import poster from '@/assets/videos/science/quasar-poster.webp';
import quasarMp4 from '@/assets/videos/science/quasar.mp4';
import quasarWebm from '@/assets/videos/science/quasar.webm';
import styles from '@/components/sections/Science/Science.module.scss';

// Visor circular: cámara con el vídeo del cuásar. No depende del estado: un clic no lo vuelve a
// renderizar (la cámara se mueve por `data-point` en la sección). Los tres puntos son el
// mismo vídeo ampliado y recortado por la cámara.
interface ViewerProps {
  // Sección de Ciencia: lleva `data-faded` cuando el fundido final ya terminó.
  sectionRef: RefObject<HTMLElement | null>;
}

export const Viewer = memo(function Viewer({ sectionRef }: ViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Se pausa con el escenario ya oculto (`data-faded`), no al empezar el fundido
  useVideoPlayback(videoRef, sectionRef, undefined, 'faded');

  return (
    <div className={styles.viewer} aria-hidden='true'>
      <div className={styles.camera}>
        <video
          ref={videoRef}
          className={styles.quasar}
          poster={poster}
          width={986}
          height={986}
          muted
          loop
          playsInline
          preload='none'
          disablePictureInPicture
          tabIndex={-1}
        >
          <source src={quasarWebm} type='video/webm' />
          <source src={quasarMp4} type='video/mp4' />
        </video>
      </div>
    </div>
  );
});
