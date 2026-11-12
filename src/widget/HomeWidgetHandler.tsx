import {useEffect, useRef} from 'react';
import {Alert, AppState, Linking} from 'react-native';

import {enqueue, type QueuedThought} from '@/capture/queue';
import {useItemTypesStore} from '@/itemTypes/store';
import {clearPendingWidgetPrompts, peekPendingWidgetPrompts, setCaptureNotification, setShareTypes} from '@/native/homeWidgetCapture';
import {useCaptureNotificationSetting} from '@/notifications';
import {useDatabaseReady} from '@/providers/DatabaseProvider';
import {useCaptureStore} from '@/store/captureStore';
import {getItemTypeConfig} from '@/ui/itemTypeConfig';

import {extractCaptureMode, extractTextFromCaptureUrl} from './parseCaptureDeepLink';
import {refreshHomeWidgetFocusSnapshot} from './syncHomeWidgetFocus';

/** Straight into the capture queue (stored first; the worker splits and analyzes in the background). */
async function capture(texts: QueuedThought[]): Promise<boolean> {
  try {
    await enqueue(texts, undefined, true);
    return true;
  } catch (err) {
    Alert.alert('Could not save', err instanceof Error ? err.message : 'Try again');
    return false;
  }
}

let taking = false;

/**
 * Thoughts captured while the app was closed: widget popup and lock screen tile (Android), Siri and the control (iOS).
 * Cleared from native storage only after they're in the DB — a crash in between can duplicate a thought, never lose it.
 */
async function takeNativePending() {
  if (taking) return; // launch and "became active" can fire together; one read at a time, or both would save the same thoughts
  taking = true;
  try {
    const {captures, count} = await peekPendingWidgetPrompts();
    if (count && (captures.length === 0 || (await capture(captures)))) await clearPendingWidgetPrompts(count);
  } catch {
    // Left in native storage; taken on the next open.
  } finally {
    taking = false;
  }
}

export function HomeWidgetHandler() {
  const dbReady = useDatabaseReady();
  // The share sheet runs outside the app: keep its list of baskets (your types) current.
  const types = useItemTypesStore(s => s.types);
  useEffect(() => {
    if (types.length) setShareTypes(types.map(t => ({name: t.name, label: getItemTypeConfig(t.name).plural})));
  }, [types]);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!dbReady) {
      return;
    }

    takeNativePending();
    refreshHomeWidgetFocusSnapshot().catch(() => {});
    // Re-post after a reboot or a swipe-away (Android 14+ lets users dismiss ongoing notifications).
    if (useCaptureNotificationSetting.getState().enabled) setCaptureNotification(true).catch(() => {});

    const appSub = AppState.addEventListener('change', next => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        takeNativePending();
        refreshHomeWidgetFocusSnapshot().catch(() => {});
      }
      appState.current = next;
    });

    const handleUrl = (url: string | null) => {
      if (!url) {
        return;
      }
      // Widget Type / Talk buttons (iOS) open capture straight away.
      const mode = extractCaptureMode(url);
      if (mode === 'voice') return useCaptureStore.getState().openVoiceCapture();
      if (mode === 'type') return useCaptureStore.getState().openTextCapture();
      const text = extractTextFromCaptureUrl(url);
      if (text) {
        capture([text]);
      }
    };

    const linkSub = Linking.addEventListener('url', ({url}) => handleUrl(url));
    Linking.getInitialURL().then(handleUrl);

    return () => {
      appSub.remove();
      linkSub.remove();
    };
  }, [dbReady]);

  return null;
}
