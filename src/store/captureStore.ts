import {create} from 'zustand';

import type {CaptureFlowRequest} from '@/capture/captureFlow';
import type {CaptureItemDraft} from '@/capture/captureItemDraft';

type CaptureState = {
  /** Legacy overlay — kept for CaptureModal compatibility */
  isOpen: boolean;
  open: () => void;
  close: () => void;

  /** Quick-add sheet (long press on the capture button) */
  quickAddOpen: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;

  /** Voice capture sheet */
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

  quickAddOpen: false,
  openQuickAdd: () => set({quickAddOpen: true}),
  closeQuickAdd: () => set({quickAddOpen: false}),

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
