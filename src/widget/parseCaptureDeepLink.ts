/**
 * `capture://host?key=value` → {host, params}. Hand-parsed: React Native's URL has no
 * hostname/searchParams (they throw), which silently broke the old text links.
 */
function parse(url: string): {host: string; params: Record<string, string>} | null {
  const m = url.match(/^capture:\/\/([^/?#]+)\/?(?:\?([^#]*))?/i);
  if (!m) return null;
  const params: Record<string, string> = {};
  for (const pair of (m[2] ?? '').split('&').filter(Boolean)) {
    const [k, v = ''] = pair.split('=');
    try {
      params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
    } catch {
      // malformed escape: skip this pair
    }
  }
  return {host: m[1].toLowerCase(), params};
}

/** `capture://capture?text=...` or `capture://quick?text=...` */
export function extractTextFromCaptureUrl(url: string): string | null {
  const link = parse(url);
  if (!link || (link.host !== 'capture' && link.host !== 'quick')) return null;
  return link.params.text?.trim() || null;
}

/** Widget buttons: `capture://open?mode=type` or `capture://open?mode=voice` → open that capture directly. */
export function extractCaptureMode(url: string): 'type' | 'voice' | null {
  const link = parse(url);
  const mode = link?.params.mode;
  return link?.host === 'open' && (mode === 'type' || mode === 'voice') ? mode : null;
}
