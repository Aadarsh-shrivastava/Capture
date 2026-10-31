import {create} from 'zustand';

/** Session-only switch; agentic capture is the default, turn off in Dev settings for the single-prompt pipeline. */
export const useSelectiveKnowledgeStore = create<{enabled: boolean; setEnabled: (v: boolean) => void}>(
  set => ({
    enabled: true,
    setEnabled: enabled => set({enabled}),
  }),
);
