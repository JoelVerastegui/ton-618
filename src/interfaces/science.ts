export type SciencePointId = 'horizon' | 'disk' | 'lens';

export interface SciencePoint {
  id: SciencePointId;
  order: number;
  kicker: string; // p. ej. «El límite»
  title: string; // nombre del punto: «Horizonte de sucesos», «Disco de acreción», «Lente gravitacional»
  answer: string; // ≤ 40 palabras y ≤ 220 caracteres
}

export interface ScienceData {
  title: string; // «Anatomía de un monstruo» (h2 visible)
  hint: string; // invitación breve del estado inicial («Toca un punto para explorar»)
  summary: string; // equivalente textual de la ilustración para lectores de pantalla
  points: SciencePoint[];
}
