import type {MascotPose} from '@/mascot';

import {useUndoStore} from './store';

export {UndoToast} from './UndoToast';

/** Show "label · Undo" for a few seconds; tapping Undo runs `undo`, tapping the label runs `onOpen`. Optional mascot pose on the left. */
export function showUndo(label: string, undo: () => Promise<unknown> | void, pose?: MascotPose, onOpen?: () => void): void {
  useUndoStore.getState().show(label, undo, pose, onOpen);
}

/** A short note with no Undo (e.g. "Sorting…" while a capture is processed). */
export function showNote(label: string, pose?: MascotPose): void {
  useUndoStore.getState().show(label, null, pose);
}
