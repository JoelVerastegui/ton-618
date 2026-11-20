import explorationJson from '@/data/exploration.json';
import type {
  ExplorationData,
  ExplorationLevel,
  ExplorationLevelId,
} from '@/interfaces/exploration';

const exploration = explorationJson as ExplorationData;

export const levelById = (id: ExplorationLevelId): ExplorationLevel => {
  const level = exploration.levels.find((item) => item.id === id);
  if (!level) throw new Error(`Nivel de exploración desconocido: ${id}`);
  return level;
};

export const markerLabel = (level: ExplorationLevel, id: string): string =>
  level.markers?.find((marker) => marker.id === id)?.label ?? '';
