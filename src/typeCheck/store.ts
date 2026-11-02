import {create} from 'zustand';

export type TypeQuestion = {itemId: number; title: string; text: string; current: string; candidates: string[]};

/** The one open "was it…?" question (null = none). */
export const useTypeCheckStore = create<{question: TypeQuestion | null; set: (q: TypeQuestion | null) => void}>(set => ({
  question: null,
  set: question => set({question}),
}));
