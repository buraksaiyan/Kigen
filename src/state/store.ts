import { create } from 'zustand';

export interface JournalEntry {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  title: string;
  body: string;
}

interface AppState {
  journal: JournalEntry[];
  setJournal: (items: JournalEntry[]) => void;
  upsertEntry: (e: JournalEntry) => void;
}

export const useAppStore = create<AppState>((set) => ({
  journal: [],
  setJournal: (items) => set({ journal: items }),
  upsertEntry: (entry) =>
    set((s) => {
      const idx = s.journal.findIndex((j) => j.id === entry.id);
      if (idx === -1) return { journal: [entry, ...s.journal] };
      const clone = [...s.journal];
      clone[idx] = entry;
      return { journal: clone };
    })
}));