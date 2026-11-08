import type { ItemTypeName } from '@/ui/itemTypeConfig';

const URL_RE = /https?:\/\/[^\s<>"{}|\\^`[\]]+/i;

function sentenceCase(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

const SUBJECT_MAX_LEN = 56;

/**
 * Short label for Note / Journal / Idea — first line or sentence, not the full body.
 */
export function extractShortSubject(text: string, typeName: ItemTypeName): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return typeName === 'Journal' ? 'Journal entry' : 'Untitled';
  }

  const firstLine = trimmed.split(/\n/)[0]?.trim() ?? trimmed;
  const withoutUrl = firstLine.replace(URL_RE, '').trim();
  if (!withoutUrl) {
    return typeName === 'Journal' ? 'Journal entry' : 'Untitled';
  }

  if (withoutUrl.length <= SUBJECT_MAX_LEN) {
    return sentenceCase(withoutUrl.replace(/\s{2,}/g, ' ').trim());
  }

  const cut = withoutUrl.slice(0, SUBJECT_MAX_LEN);
  const lastSpace = cut.lastIndexOf(' ');
  const subject =
    lastSpace > 24 ? cut.slice(0, lastSpace) : cut.replace(/\s+\S*$/, '');
  return sentenceCase(`${subject.trim()}…`);
}
