import Voice, {
  type SpeechErrorEvent,
  type SpeechResultsEvent,
} from '@react-native-voice/voice';
import {useCallback, useEffect, useRef, useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';

export type SpeechCaptureState = 'idle' | 'listening' | 'processing';

async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Microphone permission',
      message: 'Capture needs microphone access for voice input.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

/** Voice is one global recognizer; the hook that last started listening owns its handlers. */
let owner: object | null = null;

/** Speech-to-text via @react-native-voice/voice. */
export function useSpeechCapture() {
  const [state, setState] = useState<SpeechCaptureState>('idle');
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const finalTranscriptRef = useRef('');
  const me = useRef({}).current;
  const bindRef = useRef<() => void>(() => {});

  useEffect(() => {
    // Focus and Thoughts each have a Composer: handlers are (re)bound by whichever starts listening.
    bindRef.current = () => {
      owner = me;
      // Voice.start() registers whatever handlers are set at that moment; drop the old ones so it re-registers these.
      Voice.removeAllListeners();
      Voice.onSpeechStart = () => {
        setState('listening');
        setError(null);
      };

      Voice.onSpeechEnd = () => {
        setState(prev => (prev === 'listening' ? 'processing' : prev));
      };

      Voice.onSpeechResults = (event: SpeechResultsEvent) => {
        const text = event.value?.[0]?.trim() ?? '';
        finalTranscriptRef.current = text;
        setTranscript(text);
        setPartialTranscript(text);
        setState('idle');
      };

      Voice.onSpeechPartialResults = (event: SpeechResultsEvent) => {
        const text = event.value?.[0]?.trim() ?? '';
        if (text) {
          setPartialTranscript(text);
        }
      };

      Voice.onSpeechError = (event: SpeechErrorEvent) => {
        const code = String(
          event.error?.code ?? event.error?.message?.split('/')[0] ?? '',
        );
        // 7 no match / cancelled; 5 "Client side error" = Android complaining about a stop/cancel after it already ended.
        if (
          code !== '7' &&
          code !== '5' &&
          code !== 'recognition_fail' &&
          event.error?.message !== '1110/No speech detected'
        ) {
          setError(event.error?.message ?? 'Speech recognition failed');
        }
        setState('idle');
      };
    };
    if (!owner) bindRef.current();

    return () => {
      if (owner !== me) return; // another screen's recognizer: leave it alone
      owner = null;
      Voice.destroy()
        .then(Voice.removeAllListeners)
        .catch(() => undefined);
    };
  }, [me]);

  const startListening = useCallback(async () => {
    const permitted = await requestMicPermission();
    if (!permitted) {
      setError('Microphone permission denied');
      return false;
    }

    setTranscript('');
    setPartialTranscript('');
    finalTranscriptRef.current = '';
    setError(null);
    bindRef.current();

    try {
      const available = await Voice.isAvailable();
      if (!available) {
        setError('Speech recognition is not available on this device');
        return false;
      }

      await Voice.start('en-US');
      setState('listening');
      return true;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not start listening';
      if (message.includes("doesn't seem to be linked")) {
        setError(
          'Voice native module is missing. Rebuild the app after installing dependencies (not Expo Go).',
        );
      } else {
        setError(message);
      }
      setState('idle');
      return false;
    }
  }, []);

  const stopListening = useCallback(async (): Promise<string> => {
    try {
      if (await Voice.isRecognizing()) await Voice.stop();
    } catch {
      setState('idle');
    }

    // onSpeechResults may arrive async; prefer ref then partial
    const text = finalTranscriptRef.current || partialTranscript;
    if (text) {
      setTranscript(text);
    }
    setState('idle');
    return text;
  }, [partialTranscript]);

  const cancelListening = useCallback(async () => {
    try {
      await Voice.cancel();
    } catch {
      /* ignore */
    }
    setTranscript('');
    setPartialTranscript('');
    finalTranscriptRef.current = '';
    setState('idle');
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setPartialTranscript('');
    finalTranscriptRef.current = '';
    setError(null);
    setState('idle');
  }, []);

  const displayText = partialTranscript || transcript;

  return {
    state,
    transcript,
    partialTranscript,
    displayText,
    error,
    isListening: state === 'listening',
    isProcessing: state === 'processing',
    startListening,
    stopListening,
    cancelListening,
    reset,
  };
}
