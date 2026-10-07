import {useEffect, useState} from 'react';
import {Alert, ScrollView, View} from 'react-native';

import {Sheet} from '@/components/Sheet/Sheet';
import {useCaptureAnalysis} from '@/hooks/useCaptureAnalysis';
import {useSpeechCapture} from '@/hooks/useSpeechCapture';
import {CaptureVoicePanel} from '@/screens/CaptureScreen/CaptureVoicePanel';
import {useCaptureStore} from '@/store/captureStore';
import {PillButton, PrimaryButton} from '@/ui/components/Primitives';

/** Global voice capture sheet — opened from the capture sheet or the quick-add menu. */
export function CaptureVoiceHost() {
  const visible = useCaptureStore((s) => s.voiceCaptureOpen);
  const closeVoiceCapture = useCaptureStore((s) => s.closeVoiceCapture);
  const openTextCapture = useCaptureStore((s) => s.openTextCapture);
  const openReviewCapture = useCaptureStore((s) => s.openReviewCapture);

  const speech = useSpeechCapture();
  const {analyzeText, analyzing, preloadModel} = useCaptureAnalysis();
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);

  useEffect(() => {
    if (visible) {
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
    if (!text || analyzing || isAnalyzingVoice) {
      return;
    }

    setIsAnalyzingVoice(true);
    try {
      const draft = await analyzeText(text);
      closeVoiceCapture();
      speech.reset();
      openReviewCapture(draft);
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
        <View style={{paddingHorizontal: 20, paddingTop: 8, gap: 12}}>
          {speech.displayText.trim() && !speech.isListening ? (
            <PrimaryButton
              label="Continue"
              onPress={handleContinue}
              loading={analyzing || isAnalyzingVoice}
              disabled={speech.isProcessing}
            />
          ) : null}
          <PillButton icon="create-outline" label="Type instead" onPress={handleOpenText} />
        </View>
      }>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled">
        <CaptureVoicePanel
          isListening={speech.isListening}
          isProcessing={speech.isProcessing}
          isAnalyzing={analyzing || isAnalyzingVoice}
          displayText={speech.displayText}
          error={speech.error}
          onStart={speech.startListening}
          onStop={handleOrbStop}
          onCancel={speech.cancelListening}
        />
      </ScrollView>
    </Sheet>
  );
}
