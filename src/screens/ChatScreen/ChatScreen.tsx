import {useRef, useState} from 'react';
import {Platform, ScrollView, Text, TextInput, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

import {TabScreenShell} from '@/components/TabScreenShell/TabScreenShell';
import {useKeyboardHeight} from '@/hooks/useKeyboardHeight';
import {complete} from '@/hooks/useLlamaModel';
import {designTokens, radius} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

type Message = {role: 'user' | 'assistant'; content: string};

// Small models guess their identity (often "made by Anthropic/OpenAI") unless told.
const SYSTEM =
  'You are Qwen, a small open model made by Alibaba, running offline on this phone inside the Capture notes app. ' +
  'You have no internet access. Be friendly and concise; answer briefly and plainly.';
/** The model's context is 2048 tokens: only the latest turns go along. */
const HISTORY = 8;

/** Plain chat with the on-device model. Nothing is saved and it doesn't read your items (yet). */
export function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const scroll = useRef<ScrollView>(null);
  // Android resizes the window for the keyboard (adjustResize); iOS needs the room made here.
  const keyboard = useKeyboardHeight();

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    const history: Message[] = [...messages, {role: 'user', content: text}];
    setMessages([...history, {role: 'assistant', content: ''}]);
    setDraft('');
    setBusy(true);
    const show = (content: string) => setMessages([...history, {role: 'assistant', content}]);
    try {
      const reply = await complete([{role: 'system', content: SYSTEM}, ...history.slice(-HISTORY)], show, 400);
      show(reply.trim());
    } catch (e) {
      show(`Couldn't answer: ${e instanceof Error ? e.message : 'try again'}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <TabScreenShell title="Chat">
      <ScrollView
        ref={scroll}
        onContentSizeChange={() => scroll.current?.scrollToEnd({animated: true})}
        contentContainerStyle={{padding: 20, gap: 10}}
        keyboardShouldPersistTaps="handled">
        {messages.length === 0 ? (
          <Text style={{color: designTokens.textTertiary, fontSize: 15, textAlign: 'center', marginTop: 40}}>
            Ask anything. It runs on your phone, and nothing here is saved.
          </Text>
        ) : null}
        {messages.map((m, i) => (
          <View
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: radius.lg,
              backgroundColor: m.role === 'user' ? designTokens.accent : designTokens.card,
            }}>
            <Text selectable style={{color: m.role === 'user' ? designTokens.black : designTokens.textPrimary, fontSize: 16, lineHeight: 22}}>
              {m.content || '…'}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 8,
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: (Platform.OS === 'ios' ? keyboard : 0) + 24,
          borderTopWidth: 1,
          borderTopColor: designTokens.divider,
        }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message"
          placeholderTextColor={designTokens.textTertiary}
          multiline
          style={{flex: 1, maxHeight: 120, color: designTokens.textPrimary, fontSize: 16, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.lg, backgroundColor: designTokens.field}}
        />
        <Pressable
          onPress={send}
          disabled={busy || !draft.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send"
          style={{width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: designTokens.accent, opacity: busy || !draft.trim() ? 0.4 : 1}}>
          <Ionicons name="arrow-up" size={22} color={designTokens.black} />
        </Pressable>
      </View>
    </TabScreenShell>
  );
}
