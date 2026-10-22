export type ModuleKey = 'clock' | 'timer' | 'activity' | 'note' | 'agenda' | 'music';

export type Activity = {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: number;
};

export type ActivitySession = {
  id: string;
  activityId: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  tags: string[];
  updatedAt: number;
  createdAt: number;
};

export type AgendaRecurrence = 'once' | 'weekly' | 'monthly';

export type AgendaEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  notes: string;
  location: string;
  color: string;
  recurrence: AgendaRecurrence;
  allDay: boolean;
  createdAt: number;
};

export type SequenceStep = {
  id: string;
  name: string;
  durationSec: number;
  color: string;
};

export type TimerSequence = {
  id: string;
  name: string;
  cycles: number;
  steps: SequenceStep[];
};
