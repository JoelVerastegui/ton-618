export interface ExperimentTidalCard {
  kicker: string; // p. ej. «Fuerzas de marea»
  title: string; // «Espaguetización»
  body: string; // ≤ 40 palabras, verificado y correcto para TON 618
}

export interface ExperimentData {
  title: string; // h2 visible
  subtitle: string; // frase de una línea
  hint: string; // invitación del estado inicial
  summary: string; // equivalente textual de la escena para lectores
  slider: { label: string; valueText: string }; // `{value}` se sustituye por la distancia
  canvasLabel: string; // aria-label del canvas
  tidal: ExperimentTidalCard;
}
