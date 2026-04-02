import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface Card {
  id: string;
  filePath: string;
  question: string;
  answer: string;
  stability: number;
  difficulty: number;
  dueDate: string;
  lastReview: string | null;
  state: number;
  deletedAt: string | null;
}

export interface Deck {
  name: string;
  total: number;
  due: number;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export type ViewMode = "notes" | "review" | "settings";

interface AppState {
  rootPath: string | null;
  selectedFile: string | null;
  fileContents: Record<string, string>;
  isDirty: boolean;
  cards: Card[];
  dueCards: Card[];
  decks: Deck[];
  selectedDeck: string | null;
  viewMode: ViewMode;
  editorZoom: number;
  themeId: string;
  accentId: string;
  locale: string | null;
  spellcheck: boolean;
  autoCapitalize: boolean;
  setRootPath: (path: string | null) => void;
  setSelectedFile: (path: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  setTheme: (id: string) => void;
  setAccent: (id: string) => void;
  setLocale: (locale: string | null) => void;
  setSpellcheck: (v: boolean) => void;
  setAutoCapitalize: (v: boolean) => void;
  setSelectedDeck: (deck: string | null) => void;
  fetchDecks: () => Promise<void>;
  setFileContent: (path: string, content: string) => void;
  setDirty: (dirty: boolean) => void;
  syncCards: () => Promise<void>;
  reviewCard: (id: string, rating: 1 | 2 | 3 | 4) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  rootPath: null,
  selectedFile: null,
  fileContents: {},
  isDirty: false,
  cards: [],
  dueCards: [],
  decks: [],
  selectedDeck: null,
  viewMode: "notes",
  editorZoom: 100,
  themeId: "midnight",
  accentId: "violet",
  locale: null,
  spellcheck: true,
  autoCapitalize: true,
  setRootPath: (path) =>
    set({
      rootPath: path,
      selectedFile: null,
      fileContents: {},
      isDirty: false,
      cards: [],
      dueCards: [],
      decks: [],
      selectedDeck: null,
      viewMode: "notes",
    }),
  setSelectedFile: (path) => set({ selectedFile: path, isDirty: false }),
  setViewMode: (mode) => set({ viewMode: mode, selectedDeck: null }),
  setSelectedDeck: (deck) => set({ selectedDeck: deck }),
  zoomIn: () => set((s) => ({ editorZoom: Math.min(s.editorZoom + 10, 200) })),
  zoomOut: () => set((s) => ({ editorZoom: Math.max(s.editorZoom - 10, 60) })),
  zoomReset: () => set({ editorZoom: 100 }),
  setTheme: (id) => set({ themeId: id }),
  setAccent: (id) => set({ accentId: id }),
  setLocale: (locale) => set({ locale }),
  setSpellcheck: (v) => set({ spellcheck: v }),
  setAutoCapitalize: (v) => set({ autoCapitalize: v }),
  fetchDecks: async () => {
    const { rootPath } = get();
    if (!rootPath) return;
    try {
      const decks = await invoke<Deck[]>("get_decks", { vaultPath: rootPath });
      set({ decks });
    } catch {}
  },
  setFileContent: (path, content) =>
    set((state) => ({
      fileContents: { ...state.fileContents, [path]: content },
    })),
  setDirty: (dirty) => set({ isDirty: dirty }),
  syncCards: async () => {
    const { rootPath } = get();
    if (!rootPath) return;
    try {
      const cards = await invoke<Card[]>("sync_cards", {
        vaultPath: rootPath,
      });
      const today = todayStr();
      set({
        cards,
        dueCards: cards.filter((c) => c.dueDate <= today),
      });
      get().fetchDecks();
    } catch {
      // sync failed silently
    }
  },
  reviewCard: async (id, rating) => {
    try {
      const updated = await invoke<Card>("review_card", {
        cardId: id,
        rating,
      });
      const today = todayStr();
      set((state) => {
        const cards = state.cards.map((c) => (c.id === id ? updated : c));
        return {
          cards,
          dueCards: cards.filter((c) => c.dueDate <= today),
        };
      });
    } catch {
      // review failed silently
    }
  },
}));
