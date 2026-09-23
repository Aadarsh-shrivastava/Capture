import { useCallback, useEffect, useMemo, useState } from 'react';

import { behaviorApi, itemApi, typeApi } from '@/api/itemApi';
import { getBehaviorDefinition, getDefaultFieldValues, behaviorHasFields } from '@/domain/behaviorDefinitions';
import {
  getAllowedOptionalBehaviorsForType,
  isOptionalBehaviorAllowed,
} from '@/domain/behaviorTypeConfig';
import type { Behavior } from '@/models/behavior';
import type { BehaviorDataMap, SaveItemPayload } from '@/models/behaviorData';
import type { ItemType } from '@/models/itemType';

function buildInitialBehaviorData(behaviorNames: string[]): BehaviorDataMap {
  const data: BehaviorDataMap = {};
  for (const name of behaviorNames) {
    if (behaviorHasFields(name)) {
      data[name] = getDefaultFieldValues(name);
    }
  }
  return data;
}

export function useItemForm(itemId?: number | null) {
  const isEditing = itemId != null && !Number.isNaN(itemId);

  const [types, setTypes] = useState<ItemType[]>([]);
  const [allBehaviors, setAllBehaviors] = useState<Behavior[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [defaultBehaviors, setDefaultBehaviors] = useState<Behavior[]>([]);
  const [optionalBehaviorIds, setOptionalBehaviorIds] = useState<number[]>([]);
  const [behaviorData, setBehaviorData] = useState<BehaviorDataMap>({});
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [importance, setImportance] = useState('');
  const [urgency, setUrgency] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveBehaviorNames = useMemo(() => {
    const names = new Set<string>(defaultBehaviors.map((b) => b.name));
    for (const id of optionalBehaviorIds) {
      const behavior = allBehaviors.find((b) => b.id === id);
      if (behavior) names.add(behavior.name);
    }
    return Array.from(names).sort();
  }, [allBehaviors, defaultBehaviors, optionalBehaviorIds]);

  const selectedTypeName = useMemo(
    () => types.find((t) => t.id === selectedTypeId)?.name ?? null,
    [types, selectedTypeId],
  );

  const availableOptionalBehaviors = useMemo(() => {
    if (!selectedTypeName) return [];
    const defaultIds = new Set(defaultBehaviors.map((b) => b.id));
    const effectiveIds = new Set([
      ...defaultBehaviors.map((b) => b.id),
      ...optionalBehaviorIds,
    ]);
    const allowedNames = new Set(getAllowedOptionalBehaviorsForType(selectedTypeName));
    return allBehaviors.filter(
      (b) =>
        allowedNames.has(b.name) &&
        !defaultIds.has(b.id) &&
        !effectiveIds.has(b.id),
    );
  }, [allBehaviors, defaultBehaviors, optionalBehaviorIds, selectedTypeName]);

  const loadCatalog = useCallback(async () => {
    const [loadedTypes, loadedBehaviors] = await Promise.all([
      typeApi.getItemTypes(),
      behaviorApi.getBehaviors(),
    ]);
    setTypes(loadedTypes);
    setAllBehaviors(loadedBehaviors);
    if (!isEditing && loadedTypes.length > 0) {
      const task = loadedTypes.find((t) => t.name === 'Task');
      setSelectedTypeId(task?.id ?? loadedTypes[0].id);
    }
  }, [isEditing]);

  const loadItem = useCallback(async () => {
    if (!isEditing || !itemId) return;
    const full = await itemApi.getItemFull(itemId);
    setTitle(full.title);
    setContent(full.content ?? '');
    setImportance(full.importance?.toString() ?? '');
    setUrgency(full.urgency?.toString() ?? '');
    setSelectedTypeId(full.typeId);
    setOptionalBehaviorIds(full.optionalBehaviorIds);
    setBehaviorData(full.behaviorData);
    setSelectedGroupIds(full.groupIds);
    setTagInput(full.tagNames.join(', '));
  }, [isEditing, itemId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadCatalog(), loadItem()])
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load form'))
      .finally(() => setLoading(false));
  }, [loadCatalog, loadItem]);

  useEffect(() => {
    if (!selectedTypeId) {
      setDefaultBehaviors([]);
      return;
    }
    const typeName = types.find((t) => t.id === selectedTypeId)?.name ?? '';
    itemApi
      .getTypeDefaultBehaviors(selectedTypeId)
      .then((behaviors) => {
        setDefaultBehaviors(behaviors);
        if (!isEditing) {
          setOptionalBehaviorIds([]);
          const names = behaviors.map((b) => b.name);
          setBehaviorData(buildInitialBehaviorData(names));
        } else if (typeName) {
          setOptionalBehaviorIds((current) =>
            current.filter((id) => {
              const name = allBehaviors.find((b) => b.id === id)?.name;
              return name != null && isOptionalBehaviorAllowed(typeName, name);
            }),
          );
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load behaviors'));
  }, [selectedTypeId, isEditing, types, allBehaviors]);

  function addOptionalBehavior(behaviorId: number) {
    const behavior = allBehaviors.find((b) => b.id === behaviorId);
    if (!behavior || !selectedTypeName) return;
    if (!isOptionalBehaviorAllowed(selectedTypeName, behavior.name)) return;
    setOptionalBehaviorIds((current) => [...current, behaviorId]);
    if (getBehaviorDefinition(behavior.name)?.tableName) {
      setBehaviorData((current) => ({
        ...current,
        [behavior.name]: current[behavior.name] ?? getDefaultFieldValues(behavior.name),
      }));
    }
  }

  function removeOptionalBehavior(behaviorId: number) {
    setOptionalBehaviorIds((current) => current.filter((id) => id !== behaviorId));
  }

  function setBehaviorField(behaviorName: string, field: string, value: string) {
    setBehaviorData((current) => ({
      ...current,
      [behaviorName]: { ...(current[behaviorName] ?? {}), [field]: value },
    }));
  }

  function toggleGroup(groupId: number) {
    setSelectedGroupIds((current) =>
      current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId]
    );
  }

  /** Optional single-group assignment — pass null to clear. */
  function selectGroupId(groupId: number | null) {
    setSelectedGroupIds(groupId == null ? [] : [groupId]);
  }

  function buildPayload(): SaveItemPayload {
    return {
      typeId: selectedTypeId!,
      title,
      content: content.trim() || null,
      importance: importance.trim() ? Number(importance) : null,
      urgency: urgency.trim() ? Number(urgency) : null,
      optionalBehaviorIds,
      behaviorData,
      groupIds: selectedGroupIds,
      tagNames: tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
  }

  return {
    isEditing,
    loading,
    error,
    setError,
    types,
    allBehaviors,
    selectedTypeName,
    selectedTypeId,
    setSelectedTypeId,
    defaultBehaviors,
    optionalBehaviorIds,
    effectiveBehaviorNames,
    availableOptionalBehaviors,
    behaviorData,
    title,
    setTitle,
    content,
    setContent,
    importance,
    setImportance,
    urgency,
    setUrgency,
    tagInput,
    setTagInput,
    selectedGroupIds,
    toggleGroup,
    selectGroupId,
    addOptionalBehavior,
    removeOptionalBehavior,
    setBehaviorField,
    buildPayload,
  };
}
