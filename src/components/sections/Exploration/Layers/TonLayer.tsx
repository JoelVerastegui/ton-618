import { memo } from 'react';
import clsx from 'clsx';
import { Layer } from '@/components/sections/Exploration/Layers/Layer';
import { BlackHoleField } from '@/components/sections/Exploration/Layers/BlackHoleField';
import { POS_CENTER } from '@/utils/geometry';
import shared from '@/components/sections/Exploration/Layers/LayerShared.module.scss';
import styles from '@/components/sections/Exploration/Layers/TonLayer.module.scss';

// Nivel 4 · TON 618 (representación artística): el agujero negro con su campo estelar
// (compartido con la intro de Ciencia) y el anillo de destino.
export const TonLayer = memo(function TonLayer() {
  return (
    <Layer levelId='ton618' variant='ton'>
      <BlackHoleField />

      <span className={clsx(shared.pulse, styles.pulseHole)} style={POS_CENTER} />
    </Layer>
  );
});
