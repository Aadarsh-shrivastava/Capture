import {useCallback, useState} from 'react';
import {ScrollView, Text} from 'react-native';
import {useFocusEffect, useLocalSearchParams, useRouter} from 'expo-router';

import {groupApi} from '@/api/groupApi';
import {itemApi} from '@/api/itemApi';
import {ScreenShell} from '@/components/ScreenShell/ScreenShell';
import type {CaptureItemDraft} from '@/capture/captureItemDraft';
import type {Group} from '@/models/group';
import {draftFromItemFull, saveItemDraft} from '@/services/captureItemService';
import {hasRequiredItemText} from '@/ui/components/ItemTextFields';
import {ItemForm} from '@/ui/components/ItemForm';
import {PrimaryButton} from '@/ui/components/Primitives';
import {designTokens} from '@/ui/designTokens';

const EMPTY_DRAFT: CaptureItemDraft = {
  typeName: 'Task',
  title: '',
  content: null,
  importance: null,
  urgency: null,
  tagNames: [],
  groupNames: [],
  optionalBehaviorNames: [],
  behaviorData: {},
};

export function CreateItemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{id?: string}>();
  const itemId = params.id ? Number(params.id) : null;
  const isEditing = itemId != null && !Number.isNaN(itemId);

  const [draft, setDraft] = useState<CaptureItemDraft>(EMPTY_DRAFT);
  const [groups, setGroups] = useState<Group[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const loadedGroups = await groupApi.getGroups();
      setGroups(loadedGroups);

      if (isEditing && itemId != null) {
        const full = await itemApi.getItemFull(itemId);
        setDraft(draftFromItemFull(full, loadedGroups));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load form');
    }
  }, [isEditing, itemId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleSave() {
    if (!hasRequiredItemText(draft.typeName, draft.title, draft.content ?? '')) {
      setError('Add some text first');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await saveItemDraft(draft, isEditing && itemId != null ? itemId : undefined);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save item');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenShell title={isEditing ? 'Edit item' : 'New item'} leading="back">
      <ScrollView
        contentContainerStyle={{paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40}}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ItemForm draft={draft} onChange={setDraft} groups={groups} autoFocus={!isEditing} />

        {error ? (
          <Text style={{color: designTokens.textSecondary, fontSize: 13, marginTop: 14}}>{error}</Text>
        ) : null}

        <PrimaryButton
          label={isEditing ? 'Save' : 'Create item'}
          onPress={handleSave}
          loading={saving}
          style={{marginTop: 24}}
        />
      </ScrollView>
    </ScreenShell>
  );
}
