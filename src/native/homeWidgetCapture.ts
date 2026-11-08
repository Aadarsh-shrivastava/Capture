import {NativeModules} from 'react-native';

type HomeWidgetCaptureNative = {
  /** Every thought captured outside the app (widget popup, lock screen, Siri), oldest first. Left in place until cleared. */
  peekPendingPrompts: () => Promise<string[]>;
  /** Remove the first `count` — call only once they're saved. */
  clearPendingPrompts: (count: number) => Promise<void>;
  setFocusTaskDisplay?: (
    /** JSON WidgetEntry[], oldest first: the widget shows the latest entry whose `at` has passed. */
    timeline: string,
    /** Mascot character key (male / female) for the widget's picture. */
    mascot: string,
  ) => Promise<void>;
  /** Android: pinned Type / Talk notification. iOS: the Dynamic Island / lock screen Live Activity. */
  setCaptureNotification?: (enabled: boolean) => Promise<void>;
};

const Native: HomeWidgetCaptureNative | undefined = NativeModules.HomeWidgetCapture;

export type PendingCapture = {text: string; at: Date};

/** Native entries are {"text","at"} JSON; a plain string is from before capture times were stored. */
export function parsePendingEntry(raw: string): PendingCapture {
  try {
    const {text, at} = JSON.parse(raw);
    if (typeof text === 'string') return {text: text.trim(), at: typeof at === 'number' ? new Date(at) : new Date()};
  } catch {}
  return {text: raw.trim(), at: new Date()};
}

/** Waiting thoughts plus how many native entries they came from (pass that to clearPendingWidgetPrompts). */
export async function peekPendingWidgetPrompts(): Promise<{captures: PendingCapture[]; count: number}> {
  if (!Native?.peekPendingPrompts) {
    return {captures: [], count: 0};
  }
  const raw = await Native.peekPendingPrompts();
  return {captures: raw.map(parsePendingEntry).filter(c => c.text), count: raw.length};
}

export async function clearPendingWidgetPrompts(count: number): Promise<void> {
  await Native?.clearPendingPrompts?.(count);
}

/** What the widget shows from `at` (epoch ms) on. */
export type WidgetEntry = {at: number; title: string | null; subtitle: string | null};

export async function setHomeWidgetFocusDisplay(timeline: WidgetEntry[], mascot: string): Promise<void> {
  if (!Native?.setFocusTaskDisplay) {
    return;
  }
  await Native.setFocusTaskDisplay(JSON.stringify(timeline), mascot);
}

export async function setCaptureNotification(enabled: boolean): Promise<void> {
  await Native?.setCaptureNotification?.(enabled);
}
