import type { Certainty, Quantity, Source } from './common';

export type ExplorationLevelId = 'universe' | 'cosmic-neighborhood' | 'sky-region' | 'ton618';
export type QuestionId = 'what-is' | 'where' | 'when' | 'quasar' | 'luminosity';

export interface ExplorationScale {
  label: string; // «~93 mil millones de años luz (universo observable)»
  quantity?: Quantity;
  scaleNote?: string; // «ilustrativo, no a escala»
}

export interface ExplorationMarker {
  id: string;
  label: string;
  kind: 'self' | 'reference' | 'foreground';
  description: string; // texto alternativo
  illustrative: boolean; // true → rotular «ilustrativo»
}

export interface ExplorationLevel {
  id: ExplorationLevelId;
  order: number;
  title: string;
  scale: ExplorationScale;
  markers: ExplorationMarker[];
  mapSummary: string; // equivalente textual del SVG para lectores de pantalla
}

export interface ExplorationCard {
  id: QuestionId;
  levelId: ExplorationLevelId;
  order: number; // 4a y 4b comparten nivel
  kicker: string;
  question: string;
  answer: string; // ≤ 40 palabras y ≤ 220 caracteres
  facts: Quantity[];
  certainty: Certainty; // certeza dominante
  sources: string[]; // ids de Source
}

export interface TimelineEvent {
  id: string;
  order: number;
  date: string; // «1957»
  year: number;
  title: string;
  description: string;
  certainty: Certainty;
  sources: string[];
}

export interface ExplorationData {
  kicker: string;
  title: string; // h2 visualmente oculto
  mapLegend: string; // «Mapa esquemático, no a escala»
  skipLinkLabel: string;
  levels: ExplorationLevel[];
  cards: ExplorationCard[];
  timeline: TimelineEvent[];
  sources: Source[];
}
