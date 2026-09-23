import type { ItemTypeName } from '@/ui/itemTypeConfig';

const URL_RE = /https?:\/\/[^\s<>"{}|\\^`[\]]+/i;

/** Phrases that belong in metadata, not the task title. */
const TASK_METADATA_PATTERNS: RegExp[] = [
  /\b(?:this|tis|next)\s+(?:sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?)\b/gi,
  /\b(?:today|tonight|tomorrow|eod|end of day)\b/gi,
  /\b(?:this|next)\s+(?:morning|afternoon|evening|week|weekend|month)\b/gi,
  /\bin\s+\d+\s*(?:hours?|minutes?|mins?|days?|weeks?)\b/gi,
  /\b(?:at|by|before|until|on)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi,
  /\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi,
  /\b(?:by|before|until|on)\s+(?:this|next)?\s*(?:sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?)\b/gi,
  /\b(?:by|before)\s+(?:today|tomorrow)\b/gi,
  /\b(?:it'?s|that'?s|this is)\s+(?:very\s+)?(?:urgent|important|critical|asap|a priority)\b/gi,
  /\b(?:very\s+)?(?:urgent|asap|immediately|right now|high priority)\b/gi,
  /\b(?:very\s+)?important\b/gi,
  /[—–-]\s*it'?s\s+(?:very\s+)?(?:important|urgent)\b/gi,
];

const TASK_PREFIX_PATTERNS: RegExp[] = [
  /^(?:please\s+)?(?:i\s+)?(?:need\s+to|have\s+to|got\s+to|gotta|must|should|want\s+to)\s+/i,
  /^remind\s+me\s+to\s+/i,
  /^don'?t\s+forget\s+to\s+/i,
  /^(?:can\s+you\s+)?(?:please\s+)?remember\s+to\s+/i,
  /^make\s+sure\s+(?:to\s+)?(?:i\s+)?/i,
];

/** True when a title still looks like unprocessed capture text. */
export function titleLooksLiteral(title: string, rawText: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const t = norm(title);
  const r = norm(rawText);

  if (!t || t === r) return true;
  if (r.includes(t) && t.length >= r.length * 0.65) return true;

  for (const pattern of TASK_METADATA_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(title)) return true;
  }

  for (const pattern of TASK_PREFIX_PATTERNS) {
    if (pattern.test(title)) return true;
  }

  return false;
}

function stripTaskMetadata(text: string): string {
  let result = text;
  for (const pattern of TASK_METADATA_PATTERNS) {
    result = result.replace(pattern, ' ');
  }
  return result.replace(/\s{2,}/g, ' ').trim();
}

function stripTaskPrefixes(text: string): string {
  let result = text;
  for (const pattern of TASK_PREFIX_PATTERNS) {
    result = result.replace(pattern, '');
  }
  return result.trim();
}

function sentenceCase(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Common speech-to-text word fixes for heuristic title fallback. */
function polishTaskTitle(text: string): string {
  const wordFixes: Record<string, string> = {
    banke: 'bank',
    grocies: 'groceries',
    tomorow: 'tomorrow',
    tommorow: 'tomorrow',
    recieve: 'receive',
    apointment: 'appointment',
    appoitment: 'appointment',
  };

  return text
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      const fixed = wordFixes[lower];
      if (!fixed) return word;
      return word.charAt(0) === word.charAt(0).toUpperCase() ? sentenceCase(fixed) : fixed;
    })
    .join(' ');
}

/**
 * Extract a short action-oriented title from free-form capture text.
 * Used only for heuristic fallback when the model returns a literal title.
 */
export function extractCaptureTitle(
  text: string,
  typeName: ItemTypeName = 'Task',
): string {
  const firstLine = text.trim().split(/\n/)[0]?.trim() ?? '';
  const withoutUrl = firstLine.replace(URL_RE, '').trim();
  if (!withoutUrl) return 'Untitled';

  if (typeName !== 'Task') {
    return sentenceCase(withoutUrl.replace(/\s{2,}/g, ' ').trim());
  }

  let core = stripTaskPrefixes(withoutUrl);
  core = stripTaskMetadata(core);

  const colonIdx = core.indexOf(':');
  if (colonIdx > 0 && colonIdx < 45) {
    core = core.slice(0, colonIdx);
  }

  core = core
    .replace(/^[:\-–—,\s]+|[:\-–—,\s]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!core) {
    const fallback = stripTaskPrefixes(withoutUrl).replace(/\s{2,}/g, ' ').trim();
    return polishTaskTitle(sentenceCase(fallback || 'Untitled'));
  }

  return polishTaskTitle(sentenceCase(core));
}

function titleNeedsRewrite(title: string, rawText: string, typeName: ItemTypeName): boolean {
  if (titleLooksLiteral(title, rawText)) return true;
  if (typeName !== 'Task') return false;

  for (const pattern of TASK_METADATA_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(title)) return true;
  }

  return false;
}

/** Normalize a parsed draft so title/content don't duplicate raw capture text. */
export function normalizeCaptureDraftTitle(
  draft: { title: string; content?: string | null; typeName: ItemTypeName },
  rawText: string,
): { title: string; content: string | null } {
  const title = titleNeedsRewrite(draft.title, rawText, draft.typeName)
    ? extractCaptureTitle(rawText, draft.typeName)
    : draft.title.trim();

  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  let content = draft.content ?? null;
  if (content && norm(content) === norm(rawText)) {
    content = null;
  }

  return { title: title || 'Untitled', content };
}
