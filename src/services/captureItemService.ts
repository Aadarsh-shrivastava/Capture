import {behaviorApi, itemApi, typeApi} from '@/api/itemApi';
import {groupApi} from '@/api/groupApi';
import {parseCaptureJson, type CaptureItemDraft} from '@/capture/captureItemDraft';
import {extractShortSubject} from '@/capture/captureTitle';
import {isTextPrimaryType, type ItemTypeName} from '@/ui/itemTypeConfig';
import {
  filterValidOptionalBehaviors,
  getDefaultBehaviorsForType,
} from '@/domain/behaviorTypeConfig';
import {getDefaultFieldValues} from '@/domain/behaviorDefinitions';
import type {ItemFull, SaveItemPayload} from '@/models/behaviorData';
import type {Group} from '@/models/group';

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

  let title = draft.title.trim();
  let content = draft.content?.trim() ?? null;

  if (isTextPrimaryType(draft.typeName)) {
    if (content && !title) {
      title = extractShortSubject(content, draft.typeName);
    } else if (!content && title) {
      content = title;
      title = extractShortSubject(title, draft.typeName);
    }
  }

  return {
    typeId: itemType.id,
    title: title || 'Untitled',
    content,
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

/** Build a form draft from a saved item so manual edit uses the same form. */
export function draftFromItemFull(full: ItemFull, groups: Group[]): CaptureItemDraft {
  const optionalNames = full.effectiveBehaviors
    .filter((behavior) => full.optionalBehaviorIds.includes(behavior.id))
    .map((behavior) => behavior.name);

  return {
    typeName: full.typeName as ItemTypeName,
    title: full.title,
    content: full.content,
    importance: full.importance,
    urgency: full.urgency,
    tagNames: full.tagNames,
    groupNames: groups.filter((group) => full.groupIds.includes(group.id)).map((g) => g.name),
    optionalBehaviorNames: optionalNames,
    behaviorData: full.behaviorData,
  };
}

/** Save a draft, creating a new item or updating `itemId`. */
export async function saveItemDraft(draft: CaptureItemDraft, itemId?: number) {
  const payload = await resolveCaptureDraft(draft);
  return itemApi.saveItem(payload, itemId);
}
