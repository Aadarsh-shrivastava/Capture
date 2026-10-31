import {useUndoStore} from './store';

export {UndoToast} from './UndoToast';

/** Show "label · Undo" for a few seconds; tapping Undo runs `undo`. */
export function showUndo(label: string, undo: () => Promise<unknown> | void): void {
  useUndoStore.getState().show(label, undo);
}
