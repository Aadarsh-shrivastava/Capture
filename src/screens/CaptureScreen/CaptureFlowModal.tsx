import {Ionicons} from '@expo/vector-icons';
import {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import { Pressable } from '@/ui/HapticPressable';
import {type CaptureFlowStep} from '@/capture/captureFlow';
import {useCaptureAnalysis} from '@/hooks/useCaptureAnalysis';
import {Mascot} from '@/mascot';
import {ThoughtTicker} from '@/motion';
import {saveCaptures} from '@/services/saveCaptures';
import {designTokens} from '@/ui/designTokens';
import {useThemeStore} from '@/store/themeStore';

type Props = {
  visible: boolean;
  step: CaptureFlowStep;
  /** Pre-filled text when opening text mode (e.g. from voice transcript edit). */
  initialText?: string;
  onClose: () => void;
  /** Force this group onto every analyzed draft. */
  groupName?: string;
};

export function CaptureFlowModal({
  visible,
  step,
  initialText = '',
  onClose,
  groupName,
}: Props) {
  const {theme} = useThemeStore();
  const {colors, spacing} = theme;
  const insets = useSafeAreaInsets();
  const {ready, analyzing, loadModel, analyzeMany, preloadModel} = useCaptureAnalysis();

  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<CaptureFlowStep>(step);
  const [steps, setSteps] = useState<string[]>([]);

  useEffect(() => {
    if (visible) preloadModel();
  }, [visible, preloadModel]);

  useEffect(() => {
    if (!visible) {
      setInput('');
      setError(null);
      setCurrentStep('text');
      return;
    }

    setCurrentStep(step);
    setInput(initialText);
  }, [visible, step, initialText]);

  /** Analyze (one item per thought), save straight away, close. Edits happen later from the item itself. */
  async function handleCapture() {
    const text = input.trim();
    if (!text || analyzing) return;
    setError(null);
    setCurrentStep('analyzing');
    setSteps([]);
    try {
      const drafts = await analyzeMany(text, setSteps);
      await saveCaptures(groupName ? drafts.map(d => ({...d, groupNames: [groupName]})) : drafts);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setCurrentStep('text');
    }
  }

  const headerTitle = currentStep === 'text' ? 'Type capture' : 'Capturing…';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.root, {backgroundColor: colors.background}]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, {paddingTop: insets.top + spacing.stackSm}]}>
          <Pressable onPress={onClose} hitSlop={12} disabled={currentStep === 'analyzing'}>
            <Ionicons name="close" size={24} color={currentStep === 'analyzing' ? colors.onSurfaceVariant : colors.onSurface} />
          </Pressable>
          <Text style={[styles.headerTitle, {color: colors.onSurface}]}>{headerTitle}</Text>
          <View style={{width: 24}} />
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={{padding: spacing.marginMobile, paddingBottom: 32}}
          keyboardShouldPersistTaps="handled">
          {currentStep === 'text' ? (
            <>
              <Mascot pose="curious" width={96} style={{alignSelf: 'center', marginBottom: 12}} />
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Type or paste anything…"
                placeholderTextColor={colors.placeholder}
                multiline
                autoFocus
                editable={!analyzing}
                style={[
                  styles.input,
                  {
                    color: colors.onSurface,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceContainer,
                  },
                ]}
              />

              <Pressable
                style={[
                  styles.btn,
                  (!input.trim() || analyzing) && styles.dim,
                  {backgroundColor: designTokens.accent},
                ]}
                onPress={handleCapture}
                disabled={!input.trim() || analyzing}>
                {analyzing ? (
                  <ActivityIndicator color={designTokens.black} />
                ) : (
                  <Text style={styles.btnText}>Capture</Text>
                )}
              </Pressable>

              {!ready ? (
                <Pressable
                  style={[styles.btnSecondary, {borderColor: colors.border}]}
                  onPress={loadModel}
                  disabled={analyzing}>
                  <Text style={[styles.btnSecondaryText, {color: colors.onSurface}]}>
                    {analyzing ? 'Loading model…' : 'Load AI model (optional)'}
                  </Text>
                </Pressable>
              ) : null}
            </>
          ) : null}

          {currentStep === 'analyzing' ? (
            <View style={styles.analyzingBox}>
              <Mascot pose="thinking" width={120} />
              <Text style={[styles.analyzingText, {color: colors.onSurfaceVariant}]}>
                Sorting your thoughts…
              </Text>
              {/* Latest agent step only, crossfading as the next one arrives. Fixed height so nothing shifts. */}
              <ThoughtTicker
                text={steps.length ? steps[steps.length - 1] : 'Reading your words…'}
                style={{color: colors.onSurface, fontSize: 14, marginTop: 10, minHeight: 40, textAlign: 'center'}}
              />
            </View>
          ) : null}

          {error ? (
            <View style={{alignItems: 'center', gap: 6}}>
              <Mascot pose="sheepish" width={90} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

      </KeyboardAvoidingView>
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
  body: {flex: 1},
  input: {
    minHeight: 160,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 17,
    lineHeight: 24,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {color: designTokens.black, fontWeight: '600', fontSize: 16},
  btnSecondary: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 10,
  },
  btnSecondaryText: {fontWeight: '500', fontSize: 15},
  analyzingBox: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  analyzingText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  dim: {opacity: 0.45},
  error: {color: '#e85', fontSize: 13, marginTop: 12},
});
