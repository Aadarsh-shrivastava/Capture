import {create} from 'zustand';

import type {CaptureFlowRequest} from '@/capture/captureFlow';
import type {CaptureItemDraft} from '@/capture/captureItemDraft';

type CaptureState = {
  /** Legacy overlay — kept for CaptureModal compatibility */
  isOpen: boolean;
  open: () => void;
  close: () => void;

  /** Voice capture sheet (FAB) */
  voiceCaptureOpen: boolean;
  openVoiceCapture: () => void;
  closeVoiceCapture: () => void;

  /** Unified capture flow modal (text / review) */
  flowVisible: boolean;
  flowRequest: CaptureFlowRequest | null;
  openTextCapture: (initialText?: string) => void;
  openReviewCapture: (draft: CaptureItemDraft) => void;
  closeFlow: () => void;
};

export const useCaptureStore = create<CaptureState>((set) => ({
  isOpen: false,
  open: () => set({isOpen: true}),
  close: () => set({isOpen: false}),

  voiceCaptureOpen: false,
  openVoiceCapture: () => set({voiceCaptureOpen: true}),
  closeVoiceCapture: () => set({voiceCaptureOpen: false}),

  flowVisible: false,
  flowRequest: null,

  openTextCapture: (initialText = '') =>
    set({
      flowVisible: true,
      flowRequest: {step: 'text', initialText},
    }),

  openReviewCapture: (draft) =>
    set({
      flowVisible: true,
      flowRequest: {step: 'review', initialDraft: draft},
    }),

  closeFlow: () => set({flowVisible: false, flowRequest: null}),
}));
