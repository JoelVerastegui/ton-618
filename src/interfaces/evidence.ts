export interface EvidenceCompareSide {
  label: string;
  alt: string;
}

export interface EvidenceQuestion {
  question: string;
  verdict: string;
  answer: string;
}

export interface EvidenceData {
  title: string;
  subtitle: string;
  hint: string;
  summary: string;
  compare: {
    observation: EvidenceCompareSide;
    representation: EvidenceCompareSide;
    sliderLabel: string;
    valueText: string;
  };
  questions: EvidenceQuestion[];
}
