import moment from 'moment';

/** Reference clock for resolving relative dates in capture (LLM + heuristics). */
export type CaptureDateContext = {
  now: Date;
  iso: string;
  date: string;
  time: string;
  weekday: string;
  weekdayIndex: number;
  timezone: string;
};

const WEEKDAY_ALIASES: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

export function getCaptureDateContext(now = new Date()): CaptureDateContext {
  return {
    now,
    iso: now.toISOString(),
    date: formatLocalDate(now),
    time: formatLocalTime(now),
    weekday: now.toLocaleDateString('en-US', {weekday: 'long'}),
    weekdayIndex: now.getDay(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export function formatCaptureDateContextForPrompt(ctx: CaptureDateContext): string {
  return `CURRENT DATE/TIME CONTEXT — resolve all relative dates against this:
- Now (ISO UTC): ${ctx.iso}
- Local date: ${ctx.date} (${ctx.weekday})
- Local time: ${ctx.time}
- Timezone: ${ctx.timezone}

DATE/TIME EXTRACTION — always look for clues in the user's text first:
- Scan for: today, tonight, tomorrow, weekdays (this/next Sunday…), "at 3pm", "at 5", "in 2 hours", before/by/until dates, eod, this morning/afternoon/evening
- "today" / "tonight" / "this morning" / "eod" → ${ctx.date} (or ISO datetime if a time is given)
- "tomorrow" → calendar day after ${ctx.date}
- "in N hours/minutes" → add N to current local time, output ISO 8601 datetime
- "this Sunday", "next Friday", "by Monday" → resolve to the correct YYYY-MM-DD using ${ctx.date} as anchor
- Date-only deadlines → YYYY-MM-DD; specific times → ISO 8601 (e.g. ${ctx.date}T17:00:00 for "at 5pm")
- Leave due_at as "" ONLY as a last resort when no date/time signal exists anywhere in the text`;
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatLocalTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function resolveWeekday(text: string, now: Date): Date | null {
  // Full day names alone; short ones ("sat", "sun") only after on/by/this/next — "sat in traffic" is not Saturday.
  const match =
    text.match(/\b(?:(this|tis|next|by|before|on|until)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i) ??
    text.match(/\b(this|tis|next|by|before|on|until)\s+(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/i);
  if (!match) return null;

  const modifier = match[1]?.toLowerCase();
  const targetDow = WEEKDAY_ALIASES[match[2].toLowerCase()];
  if (targetDow == null) return null;

  // "next friday" said on a Saturday means the coming Friday, as people use it; only the same weekday jumps a week.
  let daysAhead = (targetDow - now.getDay() + 7) % 7;
  if (daysAhead === 0 && modifier !== 'this' && modifier !== 'tis' && modifier !== 'on') {
    daysAhead = 7;
  }

  return addDays(now, daysAhead);
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_RE = '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?';
const COUNT_WORDS: Record<string, number> = {a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, ten: 10};

/** "nov 12", "12th november", "12 of nov" → that day; already past this year → next year. */
function resolveMonthDay(text: string, now: Date): Date | null {
  const m =
    text.match(new RegExp(`\\b${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`)) ??
    text.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_RE}`));
  if (!m) return null;
  const [month, day] = /^\d/.test(m[1]) ? [MONTHS.indexOf(m[2]), Number(m[1])] : [MONTHS.indexOf(m[1]), Number(m[2])];
  if (month < 0 || day < 1 || day > 31) return null;
  const date = new Date(now.getFullYear(), month, day, now.getHours(), now.getMinutes());
  if (moment(date).isBefore(now, 'day')) date.setFullYear(date.getFullYear() + 1);
  return date;
}

/** "in 3 days", "in two weeks", "in a month". */
function resolveInterval(text: string, now: Date): Date | null {
  const m = text.match(/\bin\s+(\d+|a|an|one|two|three|four|five|six|seven|ten)\s+(day|week|month)s?\b/);
  if (!m) return null;
  const n = /^\d/.test(m[1]) ? Number(m[1]) : COUNT_WORDS[m[1]];
  return moment(now).add(n, m[2] as 'day' | 'week' | 'month').toDate();
}

/** Day words with no weekday: next week (its Monday), this weekend (coming Saturday), end of the month. */
function resolveDayWords(text: string, now: Date): Date | null {
  if (/\bnext week\b/.test(text)) return moment(now).add(1, 'week').startOf('isoWeek').toDate();
  if (/\b(this |the )weekend\b/.test(text)) return addDays(now, now.getDay() === 0 ? 0 : 6 - now.getDay());
  if (/\bend of (the )?month\b/.test(text)) return moment(now).endOf('month').toDate();
  return null;
}

/** "at 5", "at 4:30 pm", "6pm", "9:30am" on `base`'s day. No am/pm: up to 7 is pm, and so is anything tonight / this evening. */
function parseClockTime(text: string, base: Date): Date | null {
  const m = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i) ?? text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (!m) return null;

  let hours = Number(m[1]);
  const minutes = m[2] ? Number(m[2]) : 0;
  const meridiem = m[3]?.toLowerCase();
  if (hours > 23 || minutes > 59) return null;

  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  if (!meridiem && hours < 12 && (hours <= 7 || /\b(tonight|evening)\b/.test(text))) hours += 12;

  const result = new Date(base);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/** How "tomorrow" gets typed in a hurry: tommorow, tomorow, tommorrow, tmrw, tmr, 2morrow. */
const TOMORROW_TYPOS = /\b(?:tom+or+ow|tmrw?|2mor+ow)\b/gi;
/** Misspelled "tomorrow" → "tomorrow", so date reading and date stripping both see it. */
export const fixDateTypos = (text: string) => text.replace(TOMORROW_TYPOS, 'tomorrow');

/** The due date the user said, read from their words ("gym tomorrow at 6 pm" → that time). No date words = no date. */
export function inferDueAtFromText(text: string, now = new Date()): string {
  const lower = fixDateTypos(text.toLowerCase());
  // A reminder's lead time ("remind me 2 hours before") is not when the task is due.
  const said = lower.replace(/\b(?:remind|ping|alert|notify)\s+me\b.*$/, '');

  const hoursMatch = said.match(/\bin\s+(\d+|an|a|one|two|three)\s*(?:hours?|hrs?)\b/);
  if (hoursMatch) {
    const n = /^\d/.test(hoursMatch[1]) ? Number(hoursMatch[1]) : COUNT_WORDS[hoursMatch[1]];
    return moment(now).add(n, 'hours').format();
  }

  const minutesMatch = said.match(/\bin\s+(\d+)\s*min(?:ute)?s?\b/);
  if (minutesMatch) {
    return moment(now).add(Number(minutesMatch[1]), 'minutes').format();
  }

  const baseDate =
    (/\bday after tomorrow\b/.test(said) ? addDays(now, 2) : null) ??
    (/\btomorrow\b/.test(said) ? addDays(now, 1) : null) ??
    (/\b(today|tonight|this morning|this afternoon|this evening|eod|end of day)\b/.test(said) ? new Date(now) : null) ??
    resolveInterval(said, now) ??
    resolveMonthDay(said, now) ??
    resolveDayWords(said, now) ??
    resolveWeekday(said, now);

  if (baseDate) {
    const withTime = parseClockTime(said, baseDate);
    if (withTime) return moment(withTime).format();
    return formatLocalDate(baseDate);
  }

  // Only a time ("call the bank at 5"): the next time it comes round — today, or tomorrow if it has passed.
  const timeOnly = parseClockTime(said, now);
  if (timeOnly) {
    return moment(timeOnly <= now ? addDays(timeOnly, 1) : timeOnly).format();
  }

  return '';
}
