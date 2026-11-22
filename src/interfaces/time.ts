export type TimeMilestoneId = 'sun' | 'earth' | 'life' | 'dinosaurs' | 'humans';

export interface TimeEndpoint {
  label: string;
  when: string;
}

export interface TimeMilestone {
  id: TimeMilestoneId;
  label: string;
  when: string;
}

export interface TimeData {
  title: string;
  subtitle: string;
  hint: string;
  summary: string;
  departure: TimeEndpoint;
  milestones: TimeMilestone[];
  arrival: TimeEndpoint;
  message: string;
}
