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

function resolveWeekday(text: string, now: Date, opts?: {preferNextWeek?: boolean}): Date | null {
  const match = text.match(
    /\b(?:(this|tis|next|by|before|on)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/i,
  );
  if (!match) return null;

  const modifier = match[1]?.toLowerCase();
  const dayKey = match[2].toLowerCase();
  const targetDow = WEEKDAY_ALIASES[dayKey];
  if (targetDow == null) return null;

  let daysAhead = (targetDow - now.getDay() + 7) % 7;
  if (modifier === 'next' || opts?.preferNextWeek) {
    daysAhead = daysAhead === 0 ? 7 : daysAhead + 7;
  } else if (daysAhead === 0 && modifier !== 'this' && modifier !== 'tis' && modifier !== 'on') {
    daysAhead = 7;
  }

  return addDays(now, daysAhead);
}

function parseClockTime(text: string, base: Date): Date | null {
  const atMatch = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!atMatch) return null;

  let hours = Number(atMatch[1]);
  const minutes = atMatch[2] ? Number(atMatch[2]) : 0;
  const meridiem = atMatch[3]?.toLowerCase();

  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  if (!meridiem && hours <= 7) hours += 12;

  const result = new Date(base);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/** Rule-based due date extraction for heuristic fallback. */
export function inferDueAtFromText(text: string, now = new Date()): string {
  const lower = text.toLowerCase();

  const hoursMatch = lower.match(/\bin\s+(\d+)\s*hours?\b/);
  if (hoursMatch) {
    const result = new Date(now);
    result.setHours(result.getHours() + Number(hoursMatch[1]));
    return result.toISOString();
  }

  const minutesMatch = lower.match(/\bin\s+(\d+)\s*min(?:ute)?s?\b/);
  if (minutesMatch) {
    const result = new Date(now);
    result.setMinutes(result.getMinutes() + Number(minutesMatch[1]));
    return result.toISOString();
  }

  let baseDate: Date | null = null;

  if (/\btomorrow\b/.test(lower)) {
    baseDate = addDays(now, 1);
  } else if (/\b(today|tonight|this morning|this afternoon|this evening|eod|end of day)\b/.test(lower)) {
    baseDate = new Date(now);
  } else {
    baseDate = resolveWeekday(lower, now);
  }

  if (baseDate) {
    const withTime = parseClockTime(lower, baseDate);
    if (withTime) return withTime.toISOString();
    return formatLocalDate(baseDate);
  }

  const weekdayOnly = resolveWeekday(lower, now);
  if (weekdayOnly) {
    return formatLocalDate(weekdayOnly);
  }

  if (/\b(asap|urgent|immediately|right now)\b/.test(lower)) {
    return formatLocalDate(now);
  }

  return '';
}
