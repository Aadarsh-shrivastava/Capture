/** `capture://capture?text=...` or `capture://quick?text=...` */
export function extractTextFromCaptureUrl(url: string): string | null {
  try {
    const normalized = url.replace(/^capture:\/\//, 'https://capture.app/');
    const parsed = new URL(normalized);
    const host = parsed.hostname;
    if (host !== 'capture' && host !== 'quick') {
      return null;
    }
    const text = parsed.searchParams.get('text');
    if (!text?.trim()) {
      return null;
    }
    return text.trim();
  } catch {
    return null;
  }
}
