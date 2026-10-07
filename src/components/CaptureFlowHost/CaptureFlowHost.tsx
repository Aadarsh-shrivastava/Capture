import {Alert} from 'react-native';
import {useRouter} from 'expo-router';

import {AddQuicklySheet} from '@/components/sheets/AddQuicklySheet';
import {CaptureFlowModal} from '@/screens/CaptureScreen/CaptureFlowModal';
import {useCaptureStore} from '@/store/captureStore';

/** Global capture flow — quick-add sheet plus the text/review modal. */
export function CaptureFlowHost() {
  const router = useRouter();

  const flowVisible = useCaptureStore((s) => s.flowVisible);
  const flowRequest = useCaptureStore((s) => s.flowRequest);
  const closeFlow = useCaptureStore((s) => s.closeFlow);
  const openTextCapture = useCaptureStore((s) => s.openTextCapture);
  const openVoiceCapture = useCaptureStore((s) => s.openVoiceCapture);
  const quickAddOpen = useCaptureStore((s) => s.quickAddOpen);
  const closeQuickAdd = useCaptureStore((s) => s.closeQuickAdd);

  function handleSaved(title: string) {
    Alert.alert('Captured', `"${title}" was saved.`);
    closeFlow();
  }

  return (
    <>
      <AddQuicklySheet
        visible={quickAddOpen}
        onClose={closeQuickAdd}
        onVoice={openVoiceCapture}
        onType={() => openTextCapture()}
        onManual={() => router.push('/create-item')}
      />

      {flowRequest ? (
        <CaptureFlowModal
          visible={flowVisible}
          step={flowRequest.step}
          initialText={flowRequest.initialText}
          initialDraft={flowRequest.initialDraft}
          onClose={closeFlow}
          onSaved={handleSaved}
          onBackToText={() => openTextCapture(flowRequest.initialText)}
        />
      ) : null}
    </>
  );
}
