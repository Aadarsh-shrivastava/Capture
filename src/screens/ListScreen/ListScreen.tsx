import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { ScreenShell } from '@/components/ScreenShell/ScreenShell';
import { ListOptionsSheet } from '@/components/sheets/ListOptionsSheet';
import {
  filterTasks,
  sortForList,
  TASK_FILTER_OPTIONS,
  TASK_SORT_OPTIONS,
  type TaskFilter,
  type TaskSort,
  type TaskState,
} from '@/domain/itemListing';
import { taskHistoryRepository } from '@/repositories/taskHistoryRepository';
import { useDataVersionStore } from '@/store/dataVersionStore';
import { formatDueDateLabel } from '@/ui/formatDateTime';
import { Pressable } from '@/ui/HapticPressable';
import { useItemsData } from '@/hooks/useItemsData';
import { Selectable } from '@/selection';
import { MascotMessage } from '@/mascot';
import { ItemCard } from '@/ui/components/ItemCard';
import { SearchBar } from '@/ui/components/SearchBar';
import { typeHasBehavior } from '@/domain/behaviorTypeConfig';
import { getItemTypeConfig } from '@/ui/itemTypeConfig';
import { designTokens } from '@/ui/designTokens';

export function ListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const { items, types, error, refresh } = useItemsData();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<TaskSort>('due');
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [sortOpen, setSortOpen] = useState(false);
  const [taskStates, setTaskStates] = useState<Map<number, TaskState>>(new Map());
  const version = useDataVersionStore((state) => state.version);
  const isTaskList = Boolean(params.type) && typeHasBehavior(params.type!, 'Doable');

  useEffect(() => {
    if (!isTaskList) return;
    taskHistoryRepository
      .findAll()
      .then((rows) => setTaskStates(new Map(rows.map((r) => [r.id, {dueAt: r.dueAt, status: r.status}]))))
      .catch(() => {});
  }, [isTaskList, version]);

  const activeType = useMemo(() => {
    if (!params.type || types.length === 0) return null;
    return types.find((t) => t.name === params.type) ?? null;
  }, [params.type, types]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (types.length === 0) return;
    if (!params.type || !activeType) {
      router.back();
    }
  }, [types.length, params.type, activeType, router]);

  const typeConfig = activeType ? getItemTypeConfig(activeType.name) : null;

  const filteredItems = useMemo(() => {
    if (!activeType) return [];

    let result = items.filter((item) => item.typeId === activeType.id);

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          (item.content?.toLowerCase().includes(query) ?? false),
      );
    }

    if (isTaskList) result = filterTasks(result, filter, taskStates);
    return sortForList(result, isTaskList, sort, taskStates);
  }, [items, activeType, search, sort, filter, taskStates, isTaskList]);

  const emptyMessage = search.trim()
    ? 'No matching items.'
    : `No ${(typeConfig?.plural ?? activeType?.name ?? 'items').toLowerCase()} yet.`;

  if (!activeType) {
    return null;
  }

  return (
    <ScreenShell title={typeConfig?.plural ?? activeType.name} leading="back">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <SearchBar value={search} onChangeText={setSearch} />
          </View>
          {isTaskList ? (
            <Pressable
              onPress={() => setSortOpen(true)}
              accessibilityLabel="Sort and filter"
              style={{
                width: 46,
                height: 46,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 14,
                backgroundColor: designTokens.field,
              }}>
              <Ionicons
                name="options-outline"
                size={20}
                color={filter === 'all' ? designTokens.textSecondary : designTokens.textPrimary}
              />
            </Pressable>
          ) : null}
        </View>

        {error ? (
          <Text style={{ color: designTokens.textSecondary, fontSize: 13, marginBottom: 12 }}>
            {error}
          </Text>
        ) : null}

        {filteredItems.length === 0 ? (
          <MascotMessage pose="chibiPeek" message={emptyMessage} />
        ) : (
          <View style={{ gap: 10 }}>
            {filteredItems.map((item) => (
              <Selectable key={item.id} item={item} onOpen={() => router.push(`/item/${item.id}`)}>
                {(select) => {
                  const task = isTaskList ? taskStates.get(item.id) : undefined;
                  const done = task?.status === 'completed';
                  return (
                    <View style={{ opacity: done ? 0.45 : 1 }}>
                      <ItemCard
                        title={item.title}
                        typeName={item.typeName}
                        createdAt={item.createdAt}
                        meta={done ? 'Done' : task?.dueAt ? formatDueDateLabel(task.dueAt) : isTaskList ? 'No due date' : null}
                        {...select}
                      />
                    </View>
                  );
                }}
              </Selectable>
            ))}
          </View>
        )}
      </ScrollView>

      <ListOptionsSheet
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        sortOptions={TASK_SORT_OPTIONS}
        sort={sort}
        onSort={setSort}
        filterOptions={TASK_FILTER_OPTIONS}
        filter={filter}
        onFilter={setFilter}
      />
    </ScreenShell>
  );
}
