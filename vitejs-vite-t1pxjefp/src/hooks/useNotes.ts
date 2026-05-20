import { useState, useEffect, useCallback } from 'react';

export interface BrainDumpNote {
  id: string;
  type: 'brain-dump';
  content: string;
  timestamp: string;
  date: string;
}

export interface ReflectionNote {
  id: string;
  type: 'reflection';
  date: string;
  timestamp: string;
  biggestWin: string;
  onMind: string;
  gratitude: string;
  mood: number;
  energy: number;
}

export type Note = BrainDumpNote | ReflectionNote;

const STORAGE_KEY = 'rvlifecoach_notes';

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  const addBrainDump = useCallback((content: string): BrainDumpNote => {
    const note: BrainDumpNote = {
      id: crypto.randomUUID(),
      type: 'brain-dump',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      date: todayDate(),
    };
    setNotes((prev) => [note, ...prev]);
    return note;
  }, []);

  const addReflection = useCallback(
    (data: Omit<ReflectionNote, 'id' | 'type' | 'timestamp' | 'date'>): ReflectionNote => {
      const note: ReflectionNote = {
        id: crypto.randomUUID(),
        type: 'reflection',
        date: todayDate(),
        timestamp: new Date().toISOString(),
        ...data,
      };
      setNotes((prev) => [
        note,
        ...prev.filter((n) => !(n.type === 'reflection' && n.date === todayDate())),
      ]);
      return note;
    },
    []
  );

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const getNotesForDate = useCallback(
    (date: string): Note[] => notes.filter((n) => n.date === date),
    [notes]
  );

  return {
    notes,
    addBrainDump,
    addReflection,
    deleteNote,
    getNotesForDate,
    todayDate: todayDate(),
  };
}
