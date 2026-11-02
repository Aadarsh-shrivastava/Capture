export type CaptureFlowStep = 'text' | 'analyzing';

export type CaptureFlowRequest = {
  step: CaptureFlowStep;
  initialText?: string;
  /** Pre-assign this group to whatever gets captured. */
  groupName?: string;
};
