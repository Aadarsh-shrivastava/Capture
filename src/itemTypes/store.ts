import {create} from 'zustand';

export type TypeInfo = {
  id: number;
  name: string;
  description: string | null;
  /** Ionicons name; null = built-in default for the type. */
  icon: string | null;
  isSystem: boolean;
  /** Always-on behaviors. */
  defaults: string[];
  /** Behaviors items of this type may add. */
  optional: string[];
  /** Words that point to this type (capture matching). */
  keywords: string[];
};

/** Runtime copy of item_types + type_behaviors. Pure (no DB import) so domain code and tests can read it. */
export const useItemTypesStore = create<{types: TypeInfo[]; setTypes: (t: TypeInfo[]) => void}>(set => ({
  types: [],
  setTypes: types => set({types}),
}));

export function findType(name: string): TypeInfo | undefined {
  return useItemTypesStore.getState().types.find(t => t.name === name);
}
