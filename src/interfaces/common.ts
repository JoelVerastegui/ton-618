export type Certainty = 'measured' | 'estimate' | 'derived' | 'hypothesis';

export interface Source {
  id: string;
  title: string;
  authors: string;
  year: number;
  url: string;
  accessed: string; // ISO date
  license?: string;
}

export interface Quantity {
  id: string;
  label: string;
  value: number;
  unit: string;
  displayValue: string;
  uncertainty?: { low: number; high: number };
  certainty: Certainty;
  note?: string;
  sources: string[]; // ids de Source
}

export interface ImageRef {
  src: string;
  alt: string;
  caption: string; // incluye «Representación artística»
  status?: 'pending';
  credit?: string;
  license?: string;
}
