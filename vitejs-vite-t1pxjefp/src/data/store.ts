import Dexie, { Table } from 'dexie';

export interface Week {
  id: string;       // e.g. '2025-W35'
  startsAt: string; // ISO Monday
  endsAt: string;   // ISO Sunday
}
export interface Outcome {
  id: string;
  weekId: string;     // FK -> Week
  title: string;      // "Validate AI agency offer"
  metric?: string;    // "5 outreach msgs"
  target?: number;    // 5
  status: 'planned' | 'in_progress' | 'done' | 'skipped';
}
export interface MicroAction {
  id: string;
  outcomeId: string;  // FK -> Outcome
  date: string;       // ISO day
  label: string;      // "Send 1 DM on LinkedIn"
  durationSec: number;// 120 by default
  completedAt?: string;
  usedFallback?: boolean;
}
export interface Review {
  id: string;
  weekId: string;
  notes: string;
  wins: string[];     // quick bullets
  kpiSnapshot: Record<string, number>;
}

export class AppDB extends Dexie {
  weeks!: Table<Week, string>;
  outcomes!: Table<Outcome, string>;
  actions!: Table<MicroAction, string>;
  reviews!: Table<Review, string>;
  constructor() {
    super('appdb');
    this.version(1).stores({
      weeks: 'id',
      outcomes: 'id, weekId',
      actions: 'id, outcomeId, date',
      reviews: 'id, weekId'
    });
  }
}
export const db = new AppDB();

