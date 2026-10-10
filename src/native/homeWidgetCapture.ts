import {NativeEventEmitter, NativeModules, Platform} from 'react-native';

type HomeWidgetCaptureNative = {
  getPendingPrompt: () => Promise<string | null>;
  clearPendingPrompt: () => Promise<void>;
  setFocusTaskDisplay?: (
    title: string | null,
    subtitle: string | null,
  ) => Promise<void>;
};

const Native: HomeWidgetCaptureNative | undefined = NativeModules.HomeWidgetCapture;

export const HOME_WIDGET_CAPTURE_EVENT = 'HomeWidgetCaptureSubmit';

export async function consumePendingWidgetPrompt(): Promise<string | null> {
  if (!Native?.getPendingPrompt) {
    return null;
  }

  const text = await Native.getPendingPrompt();
  if (!text?.trim()) {
    return null;
  }

  await Native.clearPendingPrompt();
  return text.trim();
}

export function subscribeWidgetCapture(listener: () => void) {
  if (!Native) {
    return null;
  }

  const emitter = new NativeEventEmitter(NativeModules.HomeWidgetCapture);
  return emitter.addListener(HOME_WIDGET_CAPTURE_EVENT, listener);
}

export function isHomeWidgetCaptureSupported(): boolean {
  return Platform.OS === 'android' || Boolean(Native?.getPendingPrompt);
}

export async function setHomeWidgetFocusDisplay(
  title: string | null,
  subtitle: string | null,
): Promise<void> {
  if (!Native?.setFocusTaskDisplay) {
    return;
  }
  await Native.setFocusTaskDisplay(title, subtitle);
}
