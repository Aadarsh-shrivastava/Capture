import {Ionicons} from '@expo/vector-icons';
import moment from 'moment';
import {Text, View} from 'react-native';

import {designTokens, radius} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';
import {getItemTypeConfig} from '@/ui/itemTypeConfig';

import type {Memo, ResurfaceAction} from './schedule';

type Props = {memo: Memo; width: number; onOpen: () => void; onAct: (a: ResurfaceAction) => void};

function TextAction({label, onPress}: {label: string; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button">
      <Text style={{color: designTokens.textSecondary, fontSize: 14, fontWeight: '500'}}>{label}</Text>
    </Pressable>
  );
}

/** A soft, rounded suggestion — not a task row: no checkbox, no due date, just "remember this?". */
export function SuggestionCard({memo, width, onOpen, onAct}: Props) {
  const icon = memo.hasLink ? 'link-outline' : getItemTypeConfig(memo.typeName).icon;
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      style={{
        width,
        borderRadius: radius.xl,
        padding: 18,
        gap: 12,
        backgroundColor: designTokens.surfaceRaised,
        borderWidth: 1,
        borderColor: designTokens.accentMuted,
      }}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
        <View style={{width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: designTokens.chip}}>
          <Ionicons name={icon} size={16} color={designTokens.textPrimary} />
        </View>
        <Text style={{color: designTokens.textTertiary, fontSize: 12}}>{moment(memo.createdAt).fromNow()}</Text>
      </View>
      <View style={{gap: 4}}>
        <Text numberOfLines={2} style={{color: designTokens.textPrimary, fontSize: 18, fontWeight: '600', lineHeight: 24}}>
          {memo.title}
        </Text>
        {memo.content && memo.content !== memo.title ? (
          <Text numberOfLines={2} style={{color: designTokens.textSecondary, fontSize: 14, lineHeight: 20}}>
            {memo.content}
          </Text>
        ) : null}
      </View>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 20}}>
        <Pressable
          onPress={() => onAct('doIt')}
          accessibilityRole="button"
          style={{backgroundColor: designTokens.accent, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7}}>
          <Text style={{color: designTokens.black, fontSize: 14, fontWeight: '600'}}>Do it today</Text>
        </Pressable>
        <TextAction label="Later" onPress={() => onAct('later')} />
        <TextAction label="Done with it" onPress={() => onAct('done')} />
      </View>
    </Pressable>
  );
}
