import {create} from 'zustand';

import type {MascotPose} from '@/mascot';

export type UndoEntry = {id: number; label: string; undo: () => Promise<unknown> | void; pose?: MascotPose};

type UndoState = {
  current: UndoEntry | null;
  show: (label: string, undo: UndoEntry['undo'], pose?: MascotPose) => void;
  hide: () => void;
};

let nextId = 1;

/** One undo at a time; a new one replaces the old (the old action just stays done). */
export const useUndoStore = create<UndoState>(set => ({
  current: null,
  show: (label, undo, pose) => set({current: {id: nextId++, label, undo, pose}}),
  hide: () => set({current: null}),
}));
