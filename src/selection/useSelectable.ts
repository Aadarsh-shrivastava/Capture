import {useSelectionStore, type SelectedItem} from './store';

/**
 * Row wiring: long press starts/extends selection; while selecting, tap toggles instead of opening.
 */
export function useSelectable(item: SelectedItem, open: () => void) {
  const selected = useSelectionStore(state => Boolean(state.items[item.id]));
  const selecting = useSelectionStore(state => Object.keys(state.items).length > 0);
  const toggle = useSelectionStore(state => state.toggle);

  return {
    selected,
    onPress: () => (selecting ? toggle(item) : open()),
    onLongPress: () => toggle(item),
  };
}
