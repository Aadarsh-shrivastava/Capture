import {create} from 'zustand';

export type SelectedItem = {id: number; title: string; typeName: string};

type SelectionState = {
  items: Record<number, SelectedItem>;
  /** Rows sliding out after a bulk action: id → position in the stagger. */
  leaving: Record<number, number>;
  toggle: (item: SelectedItem) => void;
  clear: () => void;
  setLeaving: (ids: number[]) => void;
};

export const useSelectionStore = create<SelectionState>(set => ({
  items: {},
  leaving: {},
  toggle: item =>
    set(state => {
      const items = {...state.items};
      if (items[item.id]) delete items[item.id];
      else items[item.id] = item;
      return {items};
    }),
  clear: () => set({items: {}}),
  setLeaving: ids => set({leaving: Object.fromEntries(ids.map((id, index) => [id, index]))}),
}));

export const selectedList = (items: Record<number, SelectedItem>) => Object.values(items);
