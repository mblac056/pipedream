export const NOTE_KEYS = ["G", "A", "B", "C", "D", "E", "F", "g", "a"] as const;
export type NoteKey = typeof NOTE_KEYS[number];

export interface SavedTune {
  name: string;
  tune: NoteKey[];
} 