import { UniverseLayer } from '@/components/sections/Exploration/Layers/UniverseLayer';
import { NeighborhoodLayer } from '@/components/sections/Exploration/Layers/NeighborhoodLayer';
import { SkyRegionLayer } from '@/components/sections/Exploration/Layers/SkyRegionLayer';
import { TonLayer } from '@/components/sections/Exploration/Layers/TonLayer';
import styles from '@/components/sections/Exploration/MapLayers.module.scss';

// Estrellas persistentes + mapa con las cuatro capas de nivel (ver `Layers/`).
export function MapLayers() {
  return (
    <>
      <div className={styles.starLayer} aria-hidden='true' />
      <div className={styles.map} aria-hidden='true'>
        <UniverseLayer />
        <NeighborhoodLayer />
        <SkyRegionLayer />
        <TonLayer />
      </div>
    </>
  );
}
