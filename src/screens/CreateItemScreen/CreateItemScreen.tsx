import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { groupApi } from '@/api/groupApi';
import { itemApi } from '@/api/itemApi';
import { ScreenShell } from '@/components/ScreenShell/ScreenShell';
import { useItemForm } from '@/hooks/useItemForm';
import type { Group } from '@/models/group';
import { GroupDropdown, ItemTypePicker } from '@/ui/components/ItemComponents';
import { FormField } from '@/ui/components/SimpleFormFields';
import { designTokens } from '@/ui/designTokens';
import { type ItemTypeName } from '@/ui/itemTypeConfig';
import { useThemeStore } from '@/store/themeStore';

export function CreateItemScreen() {
  const { theme } = useThemeStore();
  const { spacing, colors, rounded } = theme;
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const itemId = params.id ? Number(params.id) : null;
  const [groups, setGroups] = useState<Group[]>([]);
  const [saving, setSaving] = useState(false);

  const form = useItemForm(itemId);
  const selectedTypeName = (form.selectedTypeName ?? 'Task') as ItemTypeName;

  function setTypeName(typeName: ItemTypeName) {
    const match = form.types.find((t) => t.name === typeName);
    if (match) form.setSelectedTypeId(match.id);
  }

  const loadGroups = useCallback(() => {
    groupApi.getGroups().then(setGroups).catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups]),
  );

  const selectedGroupId = form.selectedGroupIds[0] ?? null;

  async function handleSave() {
    if (!form.title.trim()) {
      form.setError('Add a title');
      return;
    }

    try {
      setSaving(true);
      form.setError(null);

      if (!form.selectedTypeId) return;
      await itemApi.saveItem(form.buildPayload(), form.isEditing ? itemId! : undefined);

      router.back();
    } catch (err) {
      form.setError(err instanceof Error ? err.message : 'Unable to save item');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenShell title={form.isEditing ? 'Edit Item' : 'Create Item'} leading="back">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.marginMobile,
          paddingTop: spacing.stackSm,
          paddingBottom: spacing.stackLg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <FormField label="Title">
          <TextInput
            value={form.title}
            onChangeText={form.setTitle}
            placeholder="Title"
            placeholderTextColor={colors.placeholder}
            autoFocus={!form.isEditing}
            style={{
              color: colors.onSurface,
              fontSize: 20,
              fontWeight: '600',
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              paddingVertical: 8,
            }}
          />
        </FormField>

        <FormField label="Type">
          <ItemTypePicker value={selectedTypeName} onChange={setTypeName} />
        </FormField>

        <FormField label="Notes">
          <TextInput
            value={form.content}
            onChangeText={form.setContent}
            placeholder="Optional details"
            placeholderTextColor={colors.placeholder}
            multiline
            style={{
              color: colors.onSurface,
              fontSize: 15,
              lineHeight: 22,
              minHeight: 72,
              textAlignVertical: 'top',
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceContainer,
              borderRadius: rounded.md,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          />
        </FormField>

        <FormField label="Group (optional)">
          <GroupDropdown
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelect={form.selectGroupId}
          />
        </FormField>

        <FormField label="Tags">
          <TextInput
            value={form.tagInput}
            onChangeText={form.setTagInput}
            placeholder="comma separated"
            placeholderTextColor={colors.placeholder}
            style={{
              color: colors.onSurface,
              fontSize: 15,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceContainer,
              borderRadius: rounded.md,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          />
        </FormField>

        {form.error ? (
          <Text style={{ color: '#ff8a80', fontSize: 13, marginBottom: 12 }}>{form.error}</Text>
        ) : null}

        <Pressable
          onPress={handleSave}
          disabled={saving || form.loading}
          style={{
            backgroundColor: designTokens.accent,
            borderRadius: 10,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 8,
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Text style={{ color: designTokens.white, fontSize: 16, fontWeight: '600' }}>
            {saving ? 'Saving…' : form.isEditing ? 'Save' : 'Create item'}
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenShell>
  );
}
