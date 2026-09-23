import {Ionicons} from '@expo/vector-icons';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';

import {designTokens} from '@/ui/designTokens';
import {useThemeStore} from '@/store/themeStore';

type Props = {
  isListening: boolean;
  isProcessing: boolean;
  isAnalyzing: boolean;
  displayText: string;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
};

export function CaptureVoicePanel({
  isListening,
  isProcessing,
  isAnalyzing,
  displayText,
  error,
  onStart,
  onStop,
  onCancel,
}: Props) {
  const {theme} = useThemeStore();
  const {colors, rounded} = theme;

  const busy = isProcessing || isAnalyzing;
  const statusLabel = isAnalyzing
    ? 'Analyzing…'
    : isProcessing
      ? 'Processing speech…'
      : isListening
        ? 'Listening… tap to stop'
        : 'Tap to speak';

  return (
    <View style={[styles.container, {borderColor: colors.border, borderRadius: rounded.xl}]}>
      <Text style={[styles.status, {color: colors.onSurfaceVariant}]}>{statusLabel}</Text>

      <Pressable
        onPress={isListening ? onStop : onStart}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={isListening ? 'Stop recording' : 'Start voice capture'}
        style={[
          styles.micButton,
          {
            backgroundColor: isListening ? designTokens.accent : colors.surfaceContainer,
            borderColor: isListening ? designTokens.accent : colors.border,
            opacity: busy ? 0.5 : 1,
          },
        ]}>
        {busy ? (
          <ActivityIndicator color={designTokens.accent} size="large" />
        ) : (
          <Ionicons
            name={isListening ? 'stop' : 'mic'}
            size={40}
            color={isListening ? '#fff' : designTokens.accent}
          />
        )}
      </Pressable>

      {isListening ? (
        <View style={styles.listeningRow}>
          <View style={[styles.pulseDot, {backgroundColor: designTokens.accent}]} />
          <Pressable onPress={onCancel} hitSlop={8}>
            <Text style={[styles.cancelText, {color: colors.onSurfaceVariant}]}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}

      {displayText ? (
        <View style={[styles.transcriptBox, {backgroundColor: colors.surfaceContainer, borderRadius: rounded.md}]}>
          <Text style={[styles.transcriptLabel, {color: colors.onSurfaceVariant}]}>Heard</Text>
          <Text style={[styles.transcript, {color: colors.onSurface}]} numberOfLines={4}>
            {displayText}
          </Text>
        </View>
      ) : (
        <Text style={[styles.hint, {color: colors.onSurfaceVariant}]}>
          Say a task, note, idea, or journal entry — local AI will structure it for you.
        </Text>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  transcriptBox: {
    width: '100%',
    padding: 12,
    gap: 4,
  },
  transcriptLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transcript: {
    fontSize: 15,
    lineHeight: 22,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  error: {
    color: '#e85',
    fontSize: 13,
    textAlign: 'center',
  },
});
