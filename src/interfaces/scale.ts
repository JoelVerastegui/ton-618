export type ScaleStopId = 'earth' | 'sun' | 'solar-system' | 'ton618';

export interface ScaleStop {
  id: ScaleStopId;
  label: string; // texto del botón de parada: «Tierra», «Sol», «Sistema solar», «TON 618»
  kicker: string; // p. ej. «Nuestro hogar»
  title: string; // «La Tierra», «El Sol», «El Sistema solar», «TON 618»
  size: string; // medida mostrada: «12 742 km de diámetro», etc.
  answer: string; // ≤ 40 palabras y ≤ 220 caracteres
}

export interface ScaleData {
  title: string; // «Una escala inimaginable» (h2 visible)
  hint: string; // invitación del estado inicial («Desliza para alejarte»)
  summary: string; // equivalente textual de la escena para lectores de pantalla
  stops: ScaleStop[];
}
