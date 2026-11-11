import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Linking, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { Pressable } from '@/ui/HapticPressable';
import { itemApi } from '@/api/itemApi';
import { OptionsSheet } from '@/components/sheets/OptionsSheet';
import { ChecklistView, parseNumbers } from '@/behaviors';
import { isItemMascot, ItemMascot, Mascot } from '@/mascot';
import { isRepeatUnit, repeatLabel } from '@/recurrence';
import { completeTask, deleteItem, setTaskStatus } from '@/taskActions';
import { ScreenShell } from '@/components/ScreenShell/ScreenShell';
import type { ItemFull } from '@/models/behaviorData';
import { PrimaryButton } from '@/ui/components/Primitives';
import { designTokens, formatRelativeDay } from '@/ui/designTokens';
import { formatDateTimeForDisplay } from '@/ui/formatDateTime';
import { priorityFromImportance, priorityLabel, URGENT_THRESHOLD } from '@/services/itemDetailService';
import { useDataVersionStore } from '@/store/dataVersionStore';
import { useThemeStore } from '@/store/themeStore';

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ItemDetailScreen() {
  const { theme } = useThemeStore();
  const { spacing } = theme;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const itemId = Number(params.id);

  const [item, setItem] = useState<ItemFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  const loadItem = useCallback(async () => {
    if (Number.isNaN(itemId)) {
      setError('Invalid item');
      return;
    }

    try {
      setError(null);
      const full = await itemApi.getItemFull(itemId);
      setItem(full);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load item');
    }
  }, [itemId]);

  useFocusEffect(
    useCallback(() => {
      loadItem();
    }, [loadItem])
  );

  // Reload after in-place edits (ticking a step, completing).
  const version = useDataVersionStore((state) => state.version);
  useEffect(() => {
    if (version > 0) loadItem();
  }, [version, loadItem]);

  async function remove() {
    if (!item) return;
    try {
      await deleteItem(item.id, item.title);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete');
    }
  }

  if (!item) {
    return (
      <ScreenShell title="Item" leading="back">
        <View style={{ padding: spacing.marginMobile }}>
          <Text style={{ color: designTokens.textSecondary }}>{error ?? 'Loading…'}</Text>
        </View>
      </ScreenShell>
    );
  }

  const visitable = item.behaviorData.Visitable;
  const doable = item.behaviorData.Doable;
  const dueAt = doable?.due_at?.trim();
  const repeatUnit = item.behaviorData.Repeatable?.interval_unit;
  const repeatDays = parseNumbers(item.behaviorData.Repeatable?.days);

  async function complete() {
    if (!item) return;
    setCompleting(true);
    try {
      await completeTask(item.id, item.title);
      await loadItem();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete');
    } finally {
      setCompleting(false);
    }
  }

  // Priority/urgency only mean something for doable items.
  const priority = doable ? priorityFromImportance(item.importance) : 'none';
  const meta = [
    priority !== 'none' ? `${priorityLabel(priority)} priority` : '',
    doable && (item.urgency ?? 0) >= URGENT_THRESHOLD ? 'Urgent' : '',
  ].filter(Boolean);

  return (
    <ScreenShell
      title={item.typeName}
      leading="back"
      right={
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={12} accessibilityLabel="More options">
          <Ionicons name="ellipsis-horizontal" size={22} color={designTokens.textPrimary} />
        </Pressable>
      }
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.stackSm,
          paddingBottom: spacing.stackLg,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, marginBottom: 8 }}>
          {isItemMascot(item.mascot) ? <ItemMascot mascot={item.mascot} size={44} /> : null}
          <Text
            style={{
              flex: 1,
              color: designTokens.textPrimary,
              fontSize: 28,
              fontWeight: '600',
              letterSpacing: -0.4,
              lineHeight: 34,
            }}
          >
            {item.title}
          </Text>
        </View>

        <Text style={{ color: designTokens.textTertiary, fontSize: 13, marginBottom: 16 }}>
          {formatRelativeDay(item.createdAt)}
          {doable?.status === 'completed' ? ' · Completed' : ''}
        </Text>

        {doable?.status === 'completed' ? <Mascot pose="wink" width={110} style={{ alignSelf: 'center', marginBottom: 12 }} /> : null}

        {dueAt ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Ionicons name="calendar-outline" size={16} color={designTokens.textSecondary} />
            <Text style={{ color: designTokens.textSecondary, fontSize: 15 }}>
              {formatDateTimeForDisplay(dueAt)}
              {isRepeatUnit(repeatUnit) ? ` · Repeats ${repeatDays.length ? repeatDays.map((d) => WEEKDAY_NAMES[d]).join(', ') : repeatLabel(repeatUnit).toLowerCase()}` : ''}
            </Text>
          </View>
        ) : null}

        {visitable?.url ? (
          <Pressable
            onPress={() => Linking.openURL(visitable.url)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}
          >
            <Ionicons name="link-outline" size={16} color={designTokens.textSecondary} />
            <Text numberOfLines={1} style={{ flex: 1, color: designTokens.textPrimary, fontSize: 15, textDecorationLine: 'underline' }}>
              {visitable.url}
            </Text>
          </Pressable>
        ) : null}

        <ChecklistView itemId={item.id} data={item.behaviorData.Divisible} />

        {meta.length > 0 ? (
          <Text style={{ color: designTokens.textTertiary, fontSize: 13, marginBottom: 16 }}>
            {meta.join(' · ')}
          </Text>
        ) : null}

        {item.content ? (
          <Text style={{ color: designTokens.textSecondary, fontSize: 16, lineHeight: 24, marginBottom: 20 }}>
            {item.content}
          </Text>
        ) : null}

        {item.tagNames.length > 0 ? (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {item.tagNames.map((tag) => (
                <View
                  key={tag}
                  style={{
                    borderWidth: 1,
                    borderColor: designTokens.surfaceBorder,
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Text style={{ color: designTokens.textSecondary, fontSize: 13 }}>#{tag}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {error ? (
          <Text style={{ color: '#ff8a80', fontSize: 13, marginTop: 12 }}>{error}</Text>
        ) : null}
      </ScrollView>

      {doable && doable.status !== 'completed' ? (
        <View
          style={{
            paddingHorizontal: spacing.marginMobile,
            paddingTop: 8,
            paddingBottom: insets.bottom + 8,
            borderTopWidth: 1,
            borderTopColor: designTokens.divider,
          }}
        >
          <PrimaryButton compact label="Complete" icon="checkmark" loading={completing} onPress={complete} />
        </View>
      ) : null}

      <OptionsSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={item.title}
        value={null}
        options={[
          { label: 'Edit', value: 'edit', icon: 'create-outline' },
          ...(doable?.status === 'completed'
            ? [{ label: 'Mark as not done', value: 'reopen', icon: 'arrow-undo-outline' as const }]
            : []),
          { label: 'Delete', value: 'delete', icon: 'trash-outline' },
        ]}
        onSelect={(value) => {
          if (value === 'edit') router.push(`/create-item?id=${item.id}`);
          if (value === 'reopen') setTaskStatus(item.id, 'pending').catch(() => {});
          if (value === 'delete') remove();
        }}
      />
    </ScreenShell>
  );
}
