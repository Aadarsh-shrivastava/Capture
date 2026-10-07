import {Ionicons} from '@expo/vector-icons';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {ScrollView, Text, TextInput, View} from 'react-native';

import {Pressable} from '@/ui/HapticPressable';
import {tagApi} from '@/api/tagApi';
import {Sheet} from '@/components/Sheet/Sheet';
import {PrimaryButton, SquareCheck} from '@/ui/components/Primitives';
import {designTokens, radius} from '@/ui/designTokens';

type TagsSheetProps = {
  visible: boolean;
  onClose: () => void;
  selected: string[];
  onSubmit: (tagNames: string[]) => void;
};

function normalize(name: string) {
  return name.trim().toLowerCase().replace(/^#/, '');
}

/** Searchable tag picker with inline tag creation. */
export function TagsSheet({visible, onClose, selected, onSubmit}: TagsSheetProps) {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>(selected);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const tags = await tagApi.getTags();
      setAllTags(tags.map((tag) => tag.name));
    } catch {
      setAllTags([]);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    setPicked(selected);
    setSearch('');
    load();
  }, [visible, selected, load]);

  const query = normalize(search);

  const visibleTags = useMemo(() => {
    const merged = [...new Set([...allTags, ...picked])].sort();
    if (!query) return merged;
    return merged.filter((tag) => tag.includes(query));
  }, [allTags, picked, query]);

  const canCreate = query.length > 0 && !visibleTags.includes(query);

  function toggle(tag: string) {
    setPicked((current) =>
      current.includes(tag) ? current.filter((name) => name !== tag) : [...current, tag],
    );
  }

  async function createTag() {
    if (!canCreate) return;
    try {
      await tagApi.createTag(query);
    } catch {
      // The tag still gets attached on save even if pre-creation fails.
    }
    setAllTags((current) => [...new Set([...current, query])]);
    setPicked((current) => [...current, query]);
    setSearch('');
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Add tags"
      footer={
        <View style={{paddingHorizontal: 20, paddingTop: 8}}>
          <PrimaryButton
            label="Done"
            onPress={() => {
              onSubmit(picked);
              onClose();
            }}
          />
        </View>
      }>
      <View style={{paddingHorizontal: 20}}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: designTokens.field,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            height: 46,
          }}>
          <Ionicons name="search" size={16} color={designTokens.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search tags..."
            placeholderTextColor={designTokens.textTertiary}
            autoCapitalize="none"
            style={{flex: 1, color: designTokens.textPrimary, fontSize: 15}}
          />
        </View>

        <ScrollView
          style={{maxHeight: 320, marginTop: 8}}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {visibleTags.map((tag) => {
            const checked = picked.includes(tag);

            return (
              <Pressable
                key={tag}
                onPress={() => toggle(tag)}
                accessibilityRole="checkbox"
                accessibilityState={{checked}}
                style={({pressed}) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 14,
                  opacity: pressed ? 0.6 : 1,
                })}>
                <SquareCheck checked={checked} />
                <Text style={{color: designTokens.textPrimary, fontSize: 16, textTransform: 'capitalize'}}>
                  {tag}
                </Text>
              </Pressable>
            );
          })}

          {canCreate ? (
            <Pressable
              onPress={createTag}
              accessibilityRole="button"
              style={({pressed}) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 14,
                opacity: pressed ? 0.6 : 1,
              })}>
              <Ionicons name="add-circle-outline" size={22} color={designTokens.textPrimary} />
              <Text style={{color: designTokens.textPrimary, fontSize: 16}}>New tag "{query}"</Text>
            </Pressable>
          ) : null}

          {visibleTags.length === 0 && !canCreate ? (
            <Text style={{color: designTokens.textTertiary, fontSize: 14, paddingVertical: 20}}>
              No tags yet.
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </Sheet>
  );
}
