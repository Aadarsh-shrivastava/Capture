import type {ComponentType} from 'react';

import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import {RepeatField} from '@/recurrence/RepeatField';

import {ChecklistField} from './ChecklistField';
import {ComeBackField} from './ComeBackField';
import {LinkField} from './LinkField';
import {RemindField} from './RemindField';

type FieldProps = {draft: CaptureItemDraft; onChange: (d: CaptureItemDraft) => void};

/**
 * Attachable behaviors and the form field each one gets. The item form and Settings → Item types
 * both read this list, so a new behavior = its definition + one entry here.
 */
export const BEHAVIOR_FIELDS: {behavior: string; label: string; Field: ComponentType<FieldProps>; needsDoable?: boolean}[] = [
  {behavior: 'Repeatable', label: 'Repeat', Field: RepeatField, needsDoable: true},
  {behavior: 'Remindable', label: 'Reminders', Field: RemindField, needsDoable: true},
  {behavior: 'Divisible', label: 'Steps', Field: ChecklistField},
  {behavior: 'Visitable', label: 'Link', Field: LinkField},
  {behavior: 'Memorable', label: 'Come back', Field: ComeBackField},
];
