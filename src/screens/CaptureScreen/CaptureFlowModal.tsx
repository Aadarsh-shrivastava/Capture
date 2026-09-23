import {Ionicons} from '@expo/vector-icons';
import {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {type CaptureFlowStep} from '@/capture/captureFlow';
import {type CaptureItemDraft} from '@/capture/captureItemDraft';
import {useCaptureAnalysis} from '@/hooks/useCaptureAnalysis';
import {createItemFromCaptureDraft} from '@/services/captureItemService';
import {designTokens} from '@/ui/designTokens';
import {useThemeStore} from '@/store/themeStore';

import {CaptureItemForm} from './CaptureItemForm';

type Props = {
  visible: boolean;
  step: CaptureFlowStep;
  /** Pre-filled text when opening text mode (e.g. from voice transcript edit). */
  initialText?: string;
  /** Draft when opening directly in review mode. */
  initialDraft?: CaptureItemDraft | null;
  onClose: () => void;
  onSaved: (title: string) => void;
  /** Called when user goes back from review to text input. */
  onBackToText?: () => void;
};

export function CaptureFlowModal({
  visible,
  step,
  initialText = '',
  initialDraft = null,
  onClose,
  onSaved,
  onBackToText,
}: Props) {
  const {theme} = useThemeStore();
  const {colors, spacing} = theme;
  const insets = useSafeAreaInsets();
  const {ready, analyzing, loadModel, analyzeText, preloadModel} = useCaptureAnalysis();

  const [input, setInput] = useState('');
  const [draft, setDraft] = useState<CaptureItemDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<CaptureFlowStep>(step);

  useEffect(() => {
    if (visible) {
      preloadModel();
    }
  }, [visible, preloadModel]);

  useEffect(() => {
    if (!visible) {
      setInput('');
      setDraft(null);
      setError(null);
      setSubmitting(false);
      setCurrentStep('text');
      return;
    }

    setCurrentStep(step);
    if (step === 'text') {
      setInput(initialText);
      setDraft(null);
    } else if (step === 'review' && initialDraft) {
      setDraft(initialDraft);
    }
  }, [visible, step, initialText, initialDraft]);

  async function runAnalysis(text: string) {
    setError(null);
    setCurrentStep('analyzing');

    try {
      const result = await analyzeText(text);
      setDraft(result);
      setCurrentStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setCurrentStep('text');
    }
  }

  async function handleAnalyze() {
    const text = input.trim();
    if (!text || analyzing) return;
    await runAnalysis(text);
  }

  async function handleSubmit() {
    if (!draft?.title.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const saved = await createItemFromCaptureDraft(draft);
      onSaved(saved.title);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    if (currentStep === 'review') {
      if (onBackToText) {
        onBackToText();
      } else {
        setCurrentStep('text');
      }
    } else {
      onClose();
    }
  }

  const headerTitle =
    currentStep === 'text'
      ? 'Type capture'
      : currentStep === 'analyzing'
        ? 'Analyzing…'
        : 'Review item';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.root, {backgroundColor: colors.background}]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, {paddingTop: insets.top + spacing.stackSm}]}>
          {currentStep === 'review' || currentStep === 'analyzing' ? (
            <Pressable onPress={handleBack} hitSlop={12} disabled={currentStep === 'analyzing'}>
              <Ionicons
                name="arrow-back"
                size={22}
                color={currentStep === 'analyzing' ? colors.onSurfaceVariant : colors.onSurface}
              />
            </Pressable>
          ) : (
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.onSurface} />
            </Pressable>
          )}
          <Text style={[styles.headerTitle, {color: colors.onSurface}]}>{headerTitle}</Text>
          <View style={{width: 24}} />
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={{padding: spacing.marginMobile, paddingBottom: 32}}
          keyboardShouldPersistTaps="handled">
          {currentStep === 'text' ? (
            <>
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
                onPress={handleAnalyze}
                disabled={!input.trim() || analyzing}>
                {analyzing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Analyze</Text>
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
              <ActivityIndicator size="large" color={designTokens.accent} />
              <Text style={[styles.analyzingText, {color: colors.onSurfaceVariant}]}>
                Turning your words into a structured item…
              </Text>
            </View>
          ) : null}

          {currentStep === 'review' && draft ? (
            <>
              <CaptureItemForm draft={draft} onChange={setDraft} />
              <Pressable
                style={[
                  styles.btn,
                  {marginTop: 8},
                  submitting && styles.dim,
                  {backgroundColor: colors.primaryContainer},
                ]}
                onPress={handleSubmit}
                disabled={submitting || !draft.title.trim()}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Create item</Text>
                )}
              </Pressable>
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
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
  btnText: {color: '#fff', fontWeight: '600', fontSize: 16},
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
