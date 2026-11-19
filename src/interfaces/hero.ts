import type { ImageRef, Quantity, Source } from '@/interfaces/common';

export interface HeroData {
  kicker: string;
  title: { main: string; tagline: string };
  subtitle: string;
  summary: string; // descripción de la escena para lectores de pantalla
  cta: { label: string; targetSectionId: string };
  artwork: ImageRef;
  layers: HeroParallaxLayer[];
  facts: HeroFact[];
  sources: Source[];
}

export interface HeroParallaxLayer {
  id: string;
  kind: 'far-stars' | 'near-stars' | 'nebula-particles';
  order: number;
}

export interface HeroFact {
  quantity: Quantity;
  emphasis: 'primary' | 'secondary';
  revealStep: number;
}
