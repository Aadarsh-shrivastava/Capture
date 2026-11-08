import {useEffect, useState} from 'react';
import {Alert, ScrollView, View} from 'react-native';

import {Sheet} from '@/components/Sheet/Sheet';
import {CAPTURED_DONE_MS, CapturedDone} from '@/capture/CapturedDone';
import {enqueue} from '@/capture/queue';
import {splitCapture, useCaptureAnalysis} from '@/hooks/useCaptureAnalysis';
import {useSpeechCapture} from '@/hooks/useSpeechCapture';
import {CaptureVoicePanel} from '@/screens/CaptureScreen/CaptureVoicePanel';
import {useCaptureStore} from '@/store/captureStore';
import {PillButton, PrimaryButton} from '@/ui/components/Primitives';

/** Global voice capture sheet — opened from the capture sheet or the quick-add menu. */
export function CaptureVoiceHost() {
  const visible = useCaptureStore((s) => s.voiceCaptureOpen);
  const closeVoiceCapture = useCaptureStore((s) => s.closeVoiceCapture);
  const openTextCapture = useCaptureStore((s) => s.openTextCapture);

  const speech = useSpeechCapture();
  const {preloadModel} = useCaptureAnalysis();
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  /** Set once queued: shows the "Captured" moment, then the sheet closes itself. */
  const [doneCount, setDoneCount] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setDoneCount(null);
      preloadModel();
      speech.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when sheet opens
  }, [visible, preloadModel]);

  function handleClose() {
    speech.cancelListening();
    speech.reset();
    closeVoiceCapture();
  }

  async function handleOrbStop() {
    await speech.stopListening();
  }

  async function handleContinue() {
    const text = speech.displayText.trim();
    if (!text || isAnalyzingVoice) {
      return;
    }

    setIsAnalyzingVoice(true);
    try {
      // Only the split runs here; the queue turns each thought into an item in the background.
      const parts = await splitCapture(text);
      await enqueue(parts);
      setDoneCount(parts.length);
      setTimeout(() => {
        closeVoiceCapture();
        speech.reset();
      }, CAPTURED_DONE_MS);
    } catch (e) {
      Alert.alert('Analysis failed', e instanceof Error ? e.message : String(e));
    } finally {
      setIsAnalyzingVoice(false);
    }
  }

  function handleOpenText() {
    const text = speech.displayText;
    closeVoiceCapture();
    speech.reset();
    openTextCapture(text);
  }

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title="Capture"
      titleAlign="center"
      fullHeight
      footer={
        doneCount !== null ? undefined : (
          <View style={{paddingHorizontal: 20, paddingTop: 8, gap: 12}}>
            <PrimaryButton
              label="Continue"
              onPress={handleContinue}
              loading={isAnalyzingVoice}
              disabled={speech.isProcessing || speech.isListening || !speech.displayText.trim()}
            />
            <PillButton icon="create-outline" label="Type instead" onPress={handleOpenText} />
          </View>
        )
      }>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled">
        {doneCount !== null ? (
          <CapturedDone count={doneCount} />
        ) : (
          <CaptureVoicePanel
            isListening={speech.isListening}
            isProcessing={speech.isProcessing}
            isAnalyzing={isAnalyzingVoice}
            displayText={speech.displayText}
            error={speech.error}
            onStart={speech.startListening}
            onStop={handleOrbStop}
            onCancel={speech.cancelListening}
          />
        )}
      </ScrollView>
    </Sheet>
  );
}
