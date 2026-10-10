import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { Pressable } from '@/ui/HapticPressable';
import { Text } from '@/components/ui/text';
import { useThemeStore } from '@/store/themeStore';
import { designTokens } from '@/ui/designTokens';

import { getItemTypeConfig } from '@/ui/itemTypeConfig';

type ActionTileProps = {
  label: string;
  count: number;
  typeName?: string;
  filterType?: string;
};

function ActionTile({ label, count, typeName, filterType }: ActionTileProps) {
  const router = useRouter();
  const config = typeName ? getItemTypeConfig(typeName) : null;

  return (
    <Pressable
      onPress={() =>
        router.push(
          filterType
            ? { pathname: '/library/list', params: { type: filterType } }
            : '/(tabs)/library',
        )
      }
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: designTokens.surfaceBorder,
        backgroundColor: designTokens.surfaceRaised,
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 14,
      }}
    >
      <Ionicons
        name={config?.icon ?? 'bookmark-outline'}
        size={16}
        color={config?.accent ?? designTokens.textSecondary}
      />
      <Text
        style={{
          color: designTokens.textPrimary,
          fontSize: 15,
          fontWeight: '600',
          marginTop: 10,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: designTokens.textTertiary,
          fontSize: 13,
          marginTop: 2,
        }}
      >
        {count}
      </Text>
    </Pressable>
  );
}

type ActionGridProps = {
  taskCount: number;
  noteCount: number;
  journalCount: number;
  ideaCount: number;
};

export function ActionGrid({
  taskCount,
  noteCount,
  journalCount,
  ideaCount,
}: ActionGridProps) {
  const { theme } = useThemeStore();
  const { spacing } = theme;

  const tiles: ActionTileProps[] = [
    { label: 'Tasks', count: taskCount, typeName: 'Task', filterType: 'Task' },
    { label: 'Notes', count: noteCount, typeName: 'Note', filterType: 'Note' },
    { label: 'Journal', count: journalCount, typeName: 'Journal', filterType: 'Journal' },
    { label: 'Ideas', count: ideaCount, typeName: 'Idea', filterType: 'Idea' },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.stackMd,
        marginBottom: spacing.stackLg,
      }}
    >
      {tiles.map((tile) => (
        <View key={tile.label} style={{ width: '47%' }}>
          <ActionTile {...tile} />
        </View>
      ))}
    </View>
  );
}
