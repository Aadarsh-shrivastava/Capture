import {create} from 'zustand';

export type UndoEntry = {id: number; label: string; undo: () => Promise<unknown> | void};

type UndoState = {
  current: UndoEntry | null;
  show: (label: string, undo: UndoEntry['undo']) => void;
  hide: () => void;
};

let nextId = 1;

/** One undo at a time; a new one replaces the old (the old action just stays done). */
export const useUndoStore = create<UndoState>(set => ({
  current: null,
  show: (label, undo) => set({current: {id: nextId++, label, undo}}),
  hide: () => set({current: null}),
}));
