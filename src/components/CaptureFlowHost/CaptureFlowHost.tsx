import {Alert} from 'react-native';

import {CaptureFlowModal} from '@/screens/CaptureScreen/CaptureFlowModal';
import {useCaptureStore} from '@/store/captureStore';

/** Global capture flow modal — opened from store (text/review) on any screen. */
export function CaptureFlowHost() {
  const flowVisible = useCaptureStore((s) => s.flowVisible);
  const flowRequest = useCaptureStore((s) => s.flowRequest);
  const closeFlow = useCaptureStore((s) => s.closeFlow);
  const openTextCapture = useCaptureStore((s) => s.openTextCapture);

  function handleSaved(title: string) {
    Alert.alert('Captured', `"${title}" was saved.`);
    closeFlow();
  }

  if (!flowRequest) {
    return null;
  }

  return (
    <CaptureFlowModal
      visible={flowVisible}
      step={flowRequest.step}
      initialText={flowRequest.initialText}
      initialDraft={flowRequest.initialDraft}
      onClose={closeFlow}
      onSaved={handleSaved}
      onBackToText={() => openTextCapture(flowRequest.initialText)}
    />
  );
}
