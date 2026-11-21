import { memo } from 'react';
import clsx from 'clsx';
import { LayerSvg } from '@/components/sections/Exploration/Layers/Layer';
import blackHole from '@/assets/images/hero/ton618-blackhole-1024.webp';
import { dots, scatterDisk, seeded } from '@/utils/geometry';
import shared from '@/components/sections/Exploration/Layers/LayerShared.module.scss';
import styles from '@/components/sections/Exploration/Layers/BlackHoleField.module.scss';

// Estrellas del fondo, bajo la imagen del agujero negro: puntos repartidos por todo el
// cuadrado (el radio 710 cubre las esquinas). Un grupo fijo y tres que centellean con
// ritmos distintos.
const rand = seeded(618);
const [fixedStars, ...twinklingStars] = [220, 60, 60, 60].map((count) =>
  dots(scatterDisk(count, 710, rand))
);
const TWINKLE = [styles.twinkleA, styles.twinkleB, styles.twinkleC];

interface BlackHoleFieldProps {
  // Sin centelleo (`false`) los cuatro grupos de estrellas quedan fijos: cada path
  // animado es una capa compuesta.
  twinkle?: boolean;
}

// Agujero negro de TON 618 con su campo estelar: la imagen es la del Hero (misma URL:
// sin descarga nueva). Lo usan el nivel 4 de Exploración y la intro de Ciencia, así el
// fotograma que enlaza ambas es idéntico. Se posiciona en el contenedor (inset 0).
export const BlackHoleField = memo(function BlackHoleField({
  twinkle = true,
}: BlackHoleFieldProps) {
  return (
    <>
      <LayerSvg className={styles.disc}>
        <path className={clsx(shared.galaxies, styles.stars)} d={fixedStars} />
        {twinklingStars.map((d, i) => (
          <path
            key={TWINKLE[i]}
            className={clsx(shared.galaxies, styles.stars, twinkle && TWINKLE[i])}
            d={d}
          />
        ))}
      </LayerSvg>
      <img
        className={styles.blackHole}
        src={blackHole}
        alt=''
        width={1024}
        height={1024}
        decoding='async'
      />
    </>
  );
});
