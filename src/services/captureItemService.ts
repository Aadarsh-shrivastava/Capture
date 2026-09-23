import {behaviorApi, itemApi, typeApi} from '@/api/itemApi';
import {groupApi} from '@/api/groupApi';
import {parseCaptureJson, type CaptureItemDraft} from '@/capture/captureItemDraft';
import {
  filterValidOptionalBehaviors,
  getDefaultBehaviorsForType,
} from '@/domain/behaviorTypeConfig';
import {getDefaultFieldValues} from '@/domain/behaviorDefinitions';
import type {SaveItemPayload} from '@/models/behaviorData';

export async function resolveCaptureDraft(draft: CaptureItemDraft): Promise<SaveItemPayload> {
  const [types, behaviors, groups] = await Promise.all([
    typeApi.getItemTypes(),
    behaviorApi.getBehaviors(),
    groupApi.getGroups(),
  ]);

  const itemType = types.find(t => t.name === draft.typeName);
  if (!itemType) {
    throw new Error(`Unknown type: ${draft.typeName}`);
  }

  const behaviorByName = new Map(behaviors.map(b => [b.name, b.id]));
  const defaultBehaviorNames = getDefaultBehaviorsForType(draft.typeName);
  const defaultBehaviorIds = new Set(
    defaultBehaviorNames
      .map(name => behaviorByName.get(name))
      .filter((id): id is number => id != null),
  );

  const validOptionalNames = filterValidOptionalBehaviors(
    draft.typeName,
    draft.optionalBehaviorNames ?? [],
  );

  const optionalBehaviorIds: number[] = [];
  for (const name of validOptionalNames) {
    if (defaultBehaviorNames.includes(name)) continue;
    const id = behaviorByName.get(name);
    if (id != null && !defaultBehaviorIds.has(id)) {
      optionalBehaviorIds.push(id);
    }
  }

  const effectiveBehaviorNames = [...defaultBehaviorNames, ...validOptionalNames];

  const behaviorData: Record<string, Record<string, string>> = {};
  for (const name of effectiveBehaviorNames) {
    const defaults = getDefaultFieldValues(name);
    const fromDraft = draft.behaviorData?.[name] ?? {};
    behaviorData[name] = {...defaults, ...fromDraft};
  }

  const groupIds = (draft.groupNames ?? [])
    .map(name => groups.find(g => g.name.toLowerCase() === name.toLowerCase())?.id)
    .filter((id): id is number => id != null);

  return {
    typeId: itemType.id,
    title: draft.title,
    content: draft.content ?? null,
    importance: draft.importance ?? null,
    urgency: draft.urgency ?? null,
    optionalBehaviorIds,
    behaviorData,
    groupIds,
    tagNames: draft.tagNames ?? [],
  };
}

export async function createItemFromCaptureJson(rawJson: string) {
  const draft = parseCaptureJson(rawJson);
  const payload = await resolveCaptureDraft(draft);
  return itemApi.saveItem(payload);
}

export async function createItemFromCaptureDraft(draft: CaptureItemDraft) {
  const payload = await resolveCaptureDraft(draft);
  return itemApi.saveItem(payload);
}
