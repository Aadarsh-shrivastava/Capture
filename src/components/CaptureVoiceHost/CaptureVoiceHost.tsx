import {Ionicons} from '@expo/vector-icons';
import {useEffect, useState} from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useRouter} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useCaptureAnalysis} from '@/hooks/useCaptureAnalysis';
import {useSpeechCapture} from '@/hooks/useSpeechCapture';
import {CaptureVoicePanel} from '@/screens/CaptureScreen/CaptureVoicePanel';
import {useCaptureStore} from '@/store/captureStore';
import {designTokens} from '@/ui/designTokens';
import {useThemeStore} from '@/store/themeStore';

/** Global voice capture sheet — opened from the FAB. */
export function CaptureVoiceHost() {
  const {theme} = useThemeStore();
  const {colors, spacing, rounded} = theme;
  const insets = useSafeAreaInsets();
  const router = useRouter();

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

  async function handleVoiceStop() {
    const text = await speech.stopListening();
    if (!text.trim()) {
      Alert.alert(
        'No speech detected',
        'Try speaking again, or use text capture instead.',
      );
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

  function handleCreateManually() {
    closeVoiceCapture();
    speech.reset();
    router.push('/create-item');
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <View style={[styles.root, {backgroundColor: colors.background, paddingTop: insets.top}]}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.onSurface} />
          </Pressable>
          <Text style={[styles.headerTitle, {color: colors.onSurface}]}>Capture</Text>
          <View style={{width: 24}} />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.marginMobile,
            paddingBottom: insets.bottom + spacing.stackLg,
            gap: 16,
          }}
          keyboardShouldPersistTaps="handled">
          <CaptureVoicePanel
            isListening={speech.isListening}
            isProcessing={speech.isProcessing}
            isAnalyzing={analyzing || isAnalyzingVoice}
            displayText={speech.displayText}
            error={speech.error}
            onStart={speech.startListening}
            onStop={handleVoiceStop}
            onCancel={speech.cancelListening}
          />

          <Pressable
            onPress={handleOpenText}
            style={[
              styles.textArea,
              {borderColor: colors.border, borderRadius: rounded.lg, backgroundColor: colors.surfaceContainer},
            ]}
            accessibilityRole="button"
            accessibilityLabel="Type or paste capture">
            <Ionicons name="create-outline" size={18} color={colors.onSurfaceVariant} />
            <Text style={[styles.textAreaLabel, {color: colors.onSurfaceVariant}]}>
              {speech.displayText ? 'Edit as text…' : 'Type or paste instead…'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleCreateManually}
            style={[styles.manualBtn, {borderColor: colors.border, borderRadius: rounded.lg}]}
            accessibilityRole="button"
            accessibilityLabel="Create item manually">
            <Ionicons name="list-outline" size={18} color={colors.onSurface} />
            <Text style={[styles.manualBtnText, {color: colors.onSurface}]}>Create manually</Text>
          </Pressable>

          <Text style={[styles.flowHint, {color: colors.onSurfaceVariant}]}>
            Voice → Analyze → Review · or type · or fill the form yourself
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: designTokens.surfaceBorder,
  },
  headerTitle: {fontSize: 17, fontWeight: '600'},
  textArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textAreaLabel: {
    fontSize: 15,
    flex: 1,
  },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    paddingVertical: 14,
  },
  manualBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  flowHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
