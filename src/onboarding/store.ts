import {create} from 'zustand';

/** Dev: replay onboarding on top of an existing vault (vault step won't create anything). */
export const useOnboardingPreview = create<{preview: boolean; setPreview: (v: boolean) => void}>(set => ({
  preview: false,
  setPreview: preview => set({preview}),
}));
