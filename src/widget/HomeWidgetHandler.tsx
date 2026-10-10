import {useEffect, useRef} from 'react';
import {Alert, AppState, Linking} from 'react-native';

import {
  consumePendingWidgetPrompt,
  subscribeWidgetCapture,
} from '@/native/homeWidgetCapture';
import {useDatabaseReady} from '@/providers/DatabaseProvider';
import {quickCaptureFromText} from '@/services/quickCaptureService';

import {extractTextFromCaptureUrl} from './parseCaptureDeepLink';
import {refreshHomeWidgetFocusSnapshot} from './syncHomeWidgetFocus';

let inFlight = false;

async function processPrompt(text: string) {
  if (inFlight) {
    return;
  }
  inFlight = true;
  try {
    await quickCaptureFromText(text);
  } catch (err) {
    Alert.alert(
      'Could not save',
      err instanceof Error ? err.message : 'Try again',
    );
  } finally {
    inFlight = false;
    refreshHomeWidgetFocusSnapshot().catch(() => {});
  }
}

async function drainNativeQueue() {
  const pending = await consumePendingWidgetPrompt();
  if (pending) {
    await processPrompt(pending);
  }
}

export function HomeWidgetHandler() {
  const dbReady = useDatabaseReady();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!dbReady) {
      return;
    }

    drainNativeQueue();
    refreshHomeWidgetFocusSnapshot().catch(() => {});

    const appSub = AppState.addEventListener('change', next => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        drainNativeQueue();
        refreshHomeWidgetFocusSnapshot().catch(() => {});
      }
      appState.current = next;
    });

    const widgetSub = subscribeWidgetCapture(() => {
      drainNativeQueue();
    });

    const handleUrl = (url: string | null) => {
      if (!url) {
        return;
      }
      const text = extractTextFromCaptureUrl(url);
      if (text) {
        processPrompt(text);
      }
    };

    const linkSub = Linking.addEventListener('url', ({url}) => handleUrl(url));
    Linking.getInitialURL().then(handleUrl);

    return () => {
      appSub.remove();
      widgetSub?.remove();
      linkSub.remove();
    };
  }, [dbReady]);

  return null;
}
