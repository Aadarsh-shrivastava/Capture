import {Ionicons} from '@expo/vector-icons';
import {useIsFocused} from '@react-navigation/native';
import {useEffect, useMemo, useRef, useState} from 'react';
import {Alert, Animated, Easing, Platform, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useKeyboardHeight} from '@/hooks/useKeyboardHeight';
import {useSpeechCapture} from '@/hooks/useSpeechCapture';
import {useCaptureStore} from '@/store/captureStore';
import {showNote} from '@/undo';
import {designTokens} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

import {previewHints} from './hints';
import {enqueue} from './queue';

/** This long with no new words after you've said something = done listening; the words wait in the box to be sent. */
const SILENCE_MS = 2500;

type Props = {
  /** Called after a thought is sent (e.g. show the Thoughts stream, where its bubble appears). */
  onSent?: () => void;
  /** Laid over the screen at the bottom (no tab bar, or the keyboard is up) instead of sitting in the tab bar. */
  floating?: boolean;
};

/**
 * The only way in: type or speak right here. Sending drops the words into the capture queue, and they appear as a
 * bubble in the Thoughts stream that sorts itself — no capture screens. Widgets, Siri links and pull-to-capture point
 * here through the capture store.
 */
export function Composer({onSent, floating = false}: Props) {
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const input = useRef<TextInput>(null);
  const [text, setText] = useState('');
  const [groupName, setGroupName] = useState<string | undefined>();
  const speech = useSpeechCapture();
  const finishing = useRef(false);
  // Focus and Thoughts each have a Composer and both stay mounted: only the one on screen takes a request.
  const focused = useIsFocused();
  const request = useCaptureStore(s => s.request);
  const clearRequest = useCaptureStore(s => s.clearRequest);
  // What it will become, read from your words as you type (or speak).
  const hints = useMemo(() => previewHints(speech.isListening ? speech.displayText : text), [text, speech.isListening, speech.displayText]);
  // The sent text lifting off the bar and fading upward: where it went is in the "Added to…" note that follows.
  const [flying, setFlying] = useState<string | null>(null);
  const fly = useRef(new Animated.Value(0)).current;

  function flyAway(thought: string) {
    setFlying(thought);
    fly.setValue(0);
    Animated.timing(fly, {toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true}).start(() => setFlying(null));
  }

  async function send(raw: string) {
    const thought = raw.trim();
    if (!thought) return;
    flyAway(thought);
    setText('');
    setGroupName(undefined);
    try {
      // Stored whole; the queue splits it into thoughts and sorts each one in the background.
      await enqueue([thought], groupName, true);
      // The receipt ("Added to Focus: …") replaces this once it's sorted.
      showNote('Sorting your thought…', 'thinking');
      onSent?.();
    } catch (e) {
      setText(thought);
      Alert.alert('Could not save', e instanceof Error ? e.message : String(e));
    }
  }

  function startVoice() {
    finishing.current = false;
    input.current?.blur();
    speech.reset();
    speech.startListening();
  }

  /** Stop and put what was heard in the box, to fix and send yourself — voice is never sent on its own. */
  async function finishVoice() {
    if (finishing.current) return;
    finishing.current = true;
    const heard = ((await speech.stopListening()) || speech.displayText).trim();
    speech.reset();
    if (heard) setText(t => (t.trim() ? `${t.trim()} ${heard}` : heard));
  }

  function cancelVoice() {
    finishing.current = true;
    speech.cancelListening();
    speech.reset();
  }

  // Asked from elsewhere (widget Type/Talk, Siri, pull-to-capture, a group's "Capture new").
  useEffect(() => {
    if (!request || !focused) return;
    clearRequest();
    if (request.mode === 'voice') return startVoice();
    setText(request.text ?? '');
    setGroupName(request.groupName);
    input.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- act once per request
  }, [request, focused]);

  // A pause after some words sends it (iOS would keep listening forever otherwise).
  useEffect(() => {
    if (!speech.isListening || !speech.displayText.trim()) return;
    const timer = setTimeout(finishVoice, SILENCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart the countdown on every new word
  }, [speech.isListening, speech.displayText]);

  // Android ends recognition by itself when you stop talking: put what it heard in the box. No Voice.stop() here —
  // stopping a recognizer that already ended is what raised "Client side error".
  useEffect(() => {
    if (speech.state !== 'idle' || !speech.transcript.trim() || finishing.current) return;
    finishing.current = true;
    const heard = speech.transcript.trim();
    speech.reset();
    setText(t => (t.trim() ? `${t.trim()} ${heard}` : heard));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to the recognizer finishing
  }, [speech.state, speech.transcript]);

  // Gentle breathing on the mic while listening, so it reads as "recording".
  const breath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!speech.isListening) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        Animated.timing(breath, {toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [speech.isListening, breath]);

  const listening = speech.isListening || speech.isProcessing;
  // iOS keeps the bar above the keyboard by hand; Android resizes the window itself.
  const lift = floating && Platform.OS === 'ios' ? keyboard : 0;

  return (
    <View
      style={[
        {flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10},
        floating
          ? {position: 'absolute', left: 0, right: 0, bottom: lift, paddingBottom: keyboard > 0 ? 10 : Math.max(insets.bottom, 12), backgroundColor: designTokens.black}
          : {paddingBottom: 6},
      ]}>
      {listening ? (
        <>
          <Pressable onPress={cancelVoice} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancel recording" style={{height: 46, justifyContent: 'center'}}>
            <Ionicons name="close" size={24} color={designTokens.textSecondary} />
          </Pressable>
          <View style={{flex: 1, minHeight: 46, justifyContent: 'center', paddingHorizontal: 4}}>
            <Text numberOfLines={3} style={{color: speech.displayText ? designTokens.textPrimary : designTokens.textTertiary, fontSize: 16, lineHeight: 22}}>
              {speech.displayText || 'Listening…'}
            </Text>
          </View>
          <Pressable onPress={finishVoice} accessibilityRole="button" accessibilityLabel="Stop recording">
            <Animated.View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: designTokens.accent,
                transform: [{scale: breath.interpolate({inputRange: [0, 1], outputRange: [1, 1.12]})}],
              }}>
              <Ionicons name={speech.displayText ? 'checkmark' : 'mic'} size={22} color={designTokens.black} />
            </Animated.View>
          </Pressable>
        </>
      ) : (
        <>
          <TextInput
            ref={input}
            value={text}
            onChangeText={setText}
            placeholder={groupName ? `Something for ${groupName}…` : "What's on your mind?"}
            placeholderTextColor={designTokens.textTertiary}
            accessibilityLabel="Capture a thought"
            multiline
            style={{
              flex: 1,
              minHeight: 46,
              maxHeight: 140,
              borderRadius: 23,
              paddingHorizontal: 18,
              paddingTop: 12,
              paddingBottom: 12,
              fontSize: 16,
              color: designTokens.textPrimary,
              backgroundColor: designTokens.surfaceRaised,
              borderWidth: 1,
              borderColor: designTokens.surfaceBorder,
            }}
          />
          <Pressable
            onPress={text.trim() ? () => send(text) : startVoice}
            accessibilityRole="button"
            accessibilityLabel={text.trim() ? 'Send' : 'Speak a thought'}
            style={{width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: designTokens.accent}}>
            <Ionicons name={text.trim() ? 'arrow-up' : 'mic'} size={22} color={designTokens.black} />
          </Pressable>
        </>
      )}
      {hints.length > 0 || flying ? (
        <View pointerEvents="none" style={{position: 'absolute', left: 16, right: 16, bottom: '100%', alignItems: 'flex-start', gap: 6, paddingBottom: 6}}>
          {flying ? (
            <Animated.View
              style={{
                alignSelf: 'flex-end',
                maxWidth: '85%',
                padding: 12,
                borderRadius: 18,
                backgroundColor: designTokens.surfaceRaised,
                opacity: fly.interpolate({inputRange: [0, 1], outputRange: [1, 0]}),
                transform: [
                  {translateY: fly.interpolate({inputRange: [0, 1], outputRange: [0, -220]})},
                  {scale: fly.interpolate({inputRange: [0, 1], outputRange: [1, 0.7]})},
                ],
              }}>
              <Text numberOfLines={3} style={{color: designTokens.textPrimary, fontSize: 15}}>
                {flying}
              </Text>
            </Animated.View>
          ) : null}
          {hints.length > 0 && !flying ? (
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6}}>
              {hints.map(h => (
                <View key={h} style={{paddingHorizontal: 10, height: 26, justifyContent: 'center', borderRadius: 13, backgroundColor: designTokens.surfaceRaised, borderWidth: 1, borderColor: designTokens.surfaceBorder}}>
                  <Text style={{color: designTokens.textSecondary, fontSize: 12, fontWeight: '600'}}>{h}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
      {speech.error && !listening ? (
        <Text style={{position: 'absolute', left: 20, top: -16, color: '#e85', fontSize: 12}} numberOfLines={1}>
          {speech.error}
        </Text>
      ) : null}
    </View>
  );
}
