import {Ionicons} from '@expo/vector-icons';
import {ActivityIndicator, Pressable, Text, View} from 'react-native';

import type {FocusActivityEvent} from '@/models/focusTask';
import {designTokens, formatRelativeDay} from '@/ui/designTokens';
import {getItemTypeConfig} from '@/ui/itemTypeConfig';

type TimelineEventRowProps = {
  event: FocusActivityEvent;
  onPress?: () => void;
};

export function TimelineEventRow({event, onPress}: TimelineEventRowProps) {
  const config = getItemTypeConfig(event.typeName);

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.surfaceBorder,
      }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: config.accentMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}>
        <Ionicons name={config.icon} size={16} color={config.accent} />
      </View>
      <View style={{flex: 1}}>
        <Text style={{color: designTokens.textSecondary, fontSize: 15, lineHeight: 21}}>
          {event.label}
        </Text>
        <Text style={{color: designTokens.textTertiary, fontSize: 12, marginTop: 4}}>
          {formatRelativeDay(event.timestamp)}
        </Text>
      </View>
    </Pressable>
  );
}

export function TimelineEmptyState() {
  return (
    <View style={{paddingVertical: 48, alignItems: 'center', gap: 8}}>
      <Ionicons name="time-outline" size={36} color={designTokens.textTertiary} />
      <Text style={{color: designTokens.textSecondary, fontSize: 16, fontWeight: '500'}}>
        Nothing captured yet
      </Text>
      <Text style={{color: designTokens.textTertiary, fontSize: 14, textAlign: 'center', lineHeight: 20}}>
        Your capture history will appear here as you add tasks, notes, ideas, and journal entries.
      </Text>
    </View>
  );
}

export function TimelineLoadingState() {
  return (
    <View style={{paddingVertical: 48, alignItems: 'center'}}>
      <ActivityIndicator color={designTokens.accent} />
    </View>
  );
}
