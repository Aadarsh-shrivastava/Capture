import moment from 'moment';

const DISPLAY_DATE = 'ddd, MMM D, YYYY';
const DISPLAY_DATETIME = 'ddd, MMM D, YYYY [at] h:mm A';
const DISPLAY_TIME = 'h:mm A';

function toMoment(value: string): moment.Moment | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = trimmed.includes('T')
    ? moment.parseZone(trimmed)
    : moment(trimmed, ['YYYY-MM-DD', 'YYYY/MM/DD'], true);

  return parsed.isValid() ? parsed : null;
}

export function hasTimeComponent(value: string): boolean {
  return /T\d{2}:\d{2}/.test(value.trim());
}

/** Human-readable date/time for all UI display. Storage values stay ISO / YYYY-MM-DD. */
export function formatDateTimeForDisplay(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return '';

  const parsed = toMoment(trimmed);
  if (!parsed) return trimmed;

  if (hasTimeComponent(trimmed)) {
    return parsed.format(DISPLAY_DATETIME);
  }

  return parsed.format(DISPLAY_DATE);
}

/** Compact due-date label for task lists (Focus, cards). */
export function formatDueDateLabel(dueAt: string | null | undefined, now = moment()): string | null {
  const trimmed = dueAt?.trim();
  if (!trimmed) return null;

  const due = toMoment(trimmed);
  if (!due) return trimmed;

  const today = now.clone().startOf('day');
  const dueDay = due.clone().startOf('day');
  const diffDays = dueDay.diff(today, 'days');
  const timeSuffix = hasTimeComponent(trimmed) ? ` at ${due.format(DISPLAY_TIME)}` : '';

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return overdueDays === 1 ? `1 day overdue${timeSuffix}` : `${overdueDays} days overdue${timeSuffix}`;
  }
  if (diffDays === 0) return `Due today${timeSuffix}`;
  if (diffDays === 1) return `Due tomorrow${timeSuffix}`;
  if (diffDays <= 7) return `Due ${due.format('dddd')}${timeSuffix}`;
  return `Due ${due.format(hasTimeComponent(trimmed) ? DISPLAY_DATETIME : DISPLAY_DATE)}`;
}

export function formatRelativeDay(iso: string): string {
  const date = moment(iso);
  if (!date.isValid()) return iso;

  const today = moment().startOf('day');
  const target = date.clone().startOf('day');
  const diff = today.diff(target, 'days');

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.format('MMM D');
}

export function formatLongDate(date: Date | moment.Moment = moment()): string {
  return moment(date).format('dddd, MMMM D');
}

/** Best-effort parse of user-typed dates back to storage format. */
export function parseDateTimeInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const withTime = moment(trimmed, [DISPLAY_DATETIME, 'ddd, MMM D, YYYY [at] h:mm A', moment.ISO_8601], true);
  if (withTime.isValid()) return withTime.format();

  const dateOnly = moment(trimmed, [DISPLAY_DATE, 'ddd, MMM D, YYYY', 'YYYY-MM-DD'], true);
  if (dateOnly.isValid()) return dateOnly.format('YYYY-MM-DD');

  const loose = moment(trimmed);
  if (loose.isValid()) {
    return trimmed.toLowerCase().includes('at') || /:\d{2}/.test(trimmed)
      ? loose.format()
      : loose.format('YYYY-MM-DD');
  }

  return trimmed;
}
