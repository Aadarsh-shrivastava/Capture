import moment from 'moment';

import {inferDueAtFromText} from '@/capture/captureDateContext';
import {leadLabel, parseNumbers} from '@/behaviors/data';
import {extractRemind, extractRepeat, kindFromWords} from '@/selectiveKnowledge/extract';
import {formatDueDateLabel} from '@/ui/formatDateTime';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * What a thought will become, shown live under the input while you type — read from your words, instantly (no model):
 * where it goes and anything you said about when. Only what's certain; the model decides the rest after sending.
 */
export function previewHints(text: string, now = new Date()): string[] {
  if (!text.trim()) return [];
  const due = inferDueAtFromText(text, now);
  const kind = kindFromWords(text, now, due);
  const hints: string[] = [];

  if (kind === 'todo') hints.push('→ Focus');
  if (kind === 'day') hints.push('→ Your day');
  if (kind === 'idea') hints.push('→ Thought · comes back');
  if (kind === 'fact') hints.push('→ Thought');
  if (kind !== 'todo') return hints;

  const dueLabel = formatDueDateLabel(due, moment(now));
  if (dueLabel) hints.push(dueLabel);
  const repeat = extractRepeat(text);
  if (repeat) {
    const days = parseNumbers(repeat.days);
    hints.push(
      days.length
        ? `Every ${days.map(d => DAY_SHORT[d]).join(', ')}`
        : repeat.interval_unit === 'day'
          ? 'Every day'
          : repeat.interval_unit === 'month'
            ? 'Every month'
            : 'Every week',
    );
  }
  const remind = extractRemind(text);
  if (remind) for (const m of parseNumbers(remind.offsets)) hints.push(m === 0 ? 'Remind at the time' : `Remind ${leadLabel(m)} before`);
  return hints;
}
