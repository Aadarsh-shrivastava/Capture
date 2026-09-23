import type {CaptureItemDraft} from '@/capture/captureItemDraft';

export type CaptureFlowStep = 'text' | 'analyzing' | 'review';

export type CaptureFlowRequest = {
  step: CaptureFlowStep;
  initialText?: string;
  initialDraft?: CaptureItemDraft | null;
};
