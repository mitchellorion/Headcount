export type Chemistry = 'High' | 'Medium' | 'Low' | 'Unsure';
export type Vibe = 'Easy' | 'Intense' | 'Playful' | 'Slow burn' | 'Unknown';

export interface Note {
  id: string;
  body: string;
  createdAt: string; // ISO
}

export interface DatePlan {
  id: string;
  /** ISO datetime for the planned meetup. */
  at: string;
  place: string;
  /** Optional free-text label e.g. "Drinks". */
  label?: string;
}

export interface Contact {
  id: string;
  name: string;
  age?: number;
  role?: string; // occupation / tagline
  location?: string;
  photoUri?: string; // remote URL or local file:// URI
  active: boolean;
  favorite: boolean;
  chemistry: Chemistry;
  vibe: Vibe;
  lastSeen?: string; // ISO date (date only granularity is fine)
  tagline?: string; // short blurb shown on roster card
  notes: Note[];
  dates: DatePlan[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Shape used by the add/edit form before defaults are applied. */
export type ContactDraft = Omit<
  Contact,
  'id' | 'notes' | 'dates' | 'createdAt' | 'updatedAt'
> & {
  notes?: Note[];
  dates?: DatePlan[];
};
