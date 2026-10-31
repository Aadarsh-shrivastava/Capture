import type {MascotPose} from '@/mascot';

import {useUndoStore} from './store';

export {UndoToast} from './UndoToast';

/** Show "label · Undo" for a few seconds; tapping Undo runs `undo`. Optional mascot pose on the left. */
export function showUndo(label: string, undo: () => Promise<unknown> | void, pose?: MascotPose): void {
  useUndoStore.getState().show(label, undo, pose);
}
