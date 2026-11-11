import {create} from 'zustand';

import type {MascotPose} from '@/mascot';

/** `undo: null` = a plain note, no Undo button. */
export type UndoEntry = {id: number; label: string; undo: (() => Promise<unknown> | void) | null; pose?: MascotPose; onOpen?: () => void};

type UndoState = {
  current: UndoEntry | null;
  show: (label: string, undo: UndoEntry['undo'], pose?: MascotPose, onOpen?: () => void) => void;
  hide: () => void;
};

let nextId = 1;

/** One undo at a time; a new one replaces the old (the old action just stays done). */
export const useUndoStore = create<UndoState>(set => ({
  current: null,
  show: (label, undo, pose, onOpen) => set({current: {id: nextId++, label, undo, pose, onOpen}}),
  hide: () => set({current: null}),
}));
