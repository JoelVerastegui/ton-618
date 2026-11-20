export type ExplorationLevelId = 'universe' | 'cosmic-neighborhood' | 'sky-region' | 'ton618';
export type QuestionId = 'what-is' | 'where' | 'when' | 'quasar';

export interface ExplorationMarker {
  id: string;
  label: string;
}

export interface ExplorationLevel {
  id: ExplorationLevelId;
  order: number;
  title: string;
  ringLegend?: string; // «Cada anillo: +4 mil millones de años de viaje de la luz»
  scaleNote?: string; // «esquemático»
  markers?: ExplorationMarker[]; // etiquetas del mapa
  mapSummary: string; // equivalente textual del mapa para lectores de pantalla
}

export interface ExplorationCard {
  id: QuestionId;
  order: number;
  kicker: string;
  question: string;
  answer: string; // ≤ 40 palabras y ≤ 220 caracteres
}

export interface ExplorationData {
  title: string; // h2 visualmente oculto
  levels: ExplorationLevel[];
  cards: ExplorationCard[];
}
