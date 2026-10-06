import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Pressable } from '@/ui/HapticPressable';
import { designTokens, formatRelativeDay } from '@/ui/designTokens';
import { getItemTypeConfig } from '@/ui/itemTypeConfig';

type ItemRowProps = {
  title: string;
  typeName: string;
  createdAt: string;
  showType?: boolean;
  onPress?: () => void;
};

export function ItemRow({
  title,
  typeName,
  createdAt,
  showType = true,
  onPress,
}: ItemRowProps) {
  const config = getItemTypeConfig(typeName);

  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.surfaceBorder,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        {showType ? (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: config.accentMuted,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
            }}
          >
            <Ionicons name={config.icon} size={16} color={config.accent} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: designTokens.textPrimary,
              fontSize: 16,
              fontWeight: '500',
              marginBottom: showType ? 6 : 4,
            }}
          >
            {title}
          </Text>
          <Text style={{ color: designTokens.textTertiary, fontSize: 13 }}>
            {showType ? `${config.label} · ` : ''}
            {formatRelativeDay(createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

type SettingsRowProps = {
  label: string;
  onPress?: () => void;
};

export function SettingsRow({ label, onPress }: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.surfaceBorder,
      }}
    >
      <Text style={{ color: designTokens.textPrimary, fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

type GroupRowProps = {
  name: string;
  itemCount: number;
  onPress?: () => void;
};

export function GroupRow({ name, itemCount, onPress }: GroupRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.surfaceBorder,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: designTokens.accentMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="folder-outline" size={18} color={designTokens.accent} />
        </View>
        <Text style={{ color: designTokens.textPrimary, fontSize: 16, fontWeight: '500' }}>
          {name}
        </Text>
      </View>
      <Text style={{ color: designTokens.textTertiary, fontSize: 13 }}>{itemCount}</Text>
    </Pressable>
  );
}
