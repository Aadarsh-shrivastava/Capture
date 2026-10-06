import {Ionicons} from '@expo/vector-icons';
import {useState} from 'react';
import {Text, TextInput, View} from 'react-native';

import {Pressable} from '@/ui/HapticPressable';
import {type CaptureItemDraft} from '@/capture/captureItemDraft';
import {extractShortSubject} from '@/capture/captureTitle';
import {DateSheet} from '@/components/sheets/DateSheet';
import {TagsSheet} from '@/components/sheets/TagsSheet';
import {getDefaultFieldValues} from '@/domain/behaviorDefinitions';
import {filterValidOptionalBehaviors} from '@/domain/behaviorTypeConfig';
import type {Group} from '@/models/group';
import {
  priorityFromImportance,
  priorityLabel,
  PRIORITY_IMPORTANCE,
  type PriorityLevel,
} from '@/services/itemDetailService';
import {SelectChip} from '@/ui/components/Primitives';
import {designTokens, radius} from '@/ui/designTokens';
import {formatDayTimeSummary} from '@/ui/formatDateTime';
import {
  getBodyFieldLabel,
  getItemTypeConfig,
  isTextPrimaryType,
  ITEM_TYPE_ORDER,
  type ItemTypeName,
} from '@/ui/itemTypeConfig';

const PRIORITIES: PriorityLevel[] = ['none', 'low', 'medium', 'high'];

type Props = {
  draft: CaptureItemDraft;
  onChange: (draft: CaptureItemDraft) => void;
  groups: Group[];
  autoFocus?: boolean;
};

const fieldStyle = {
  backgroundColor: designTokens.field,
  borderRadius: radius.md,
  paddingHorizontal: 16,
  paddingVertical: 14,
  color: designTokens.textPrimary,
  fontSize: 16,
};

function Label({children}: {children: string}) {
  return (
    <Text style={{color: designTokens.textTertiary, fontSize: 13, marginBottom: 8}}>{children}</Text>
  );
}

/** Text button that reveals an optional field. */
function AddButton({label, onPress}: {label: string; onPress: () => void}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({pressed}) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        opacity: pressed ? 0.6 : 1,
      })}>
      <Ionicons name="add" size={16} color={designTokens.textSecondary} />
      <Text style={{color: designTokens.textSecondary, fontSize: 15}}>{label}</Text>
    </Pressable>
  );
}

function TypeDropdown({
  value,
  onChange,
}: {
  value: ItemTypeName;
  onChange: (type: ItemTypeName) => void;
}) {
  const [open, setOpen] = useState(false);
  const config = getItemTypeConfig(value);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={`Type: ${config.label}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: designTokens.field,
          borderRadius: radius.md,
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}>
        <Ionicons name={config.icon} size={18} color={designTokens.textPrimary} />
        <Text style={{flex: 1, color: designTokens.textPrimary, fontSize: 16}}>{config.label}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={designTokens.textTertiary}
        />
      </Pressable>

      {open ? (
        <View
          style={{
            marginTop: 6,
            backgroundColor: designTokens.card,
            borderRadius: radius.md,
            overflow: 'hidden',
          }}>
          {ITEM_TYPE_ORDER.map((typeName) => {
            const option = getItemTypeConfig(typeName);
            const selected = typeName === value;

            return (
              <Pressable
                key={typeName}
                onPress={() => {
                  onChange(typeName);
                  setOpen(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}>
                <Ionicons name={option.icon} size={18} color={designTokens.textSecondary} />
                <Text style={{flex: 1, color: designTokens.textPrimary, fontSize: 15}}>
                  {option.label}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark" size={16} color={designTokens.textPrimary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/** The single item form — used by manual create/edit and by capture review. */
export function ItemForm({draft, onChange, groups, autoFocus = false}: Props) {
  const isTask = draft.typeName === 'Task';
  const textPrimary = isTextPrimaryType(draft.typeName);
  const bodyLabel = getBodyFieldLabel(draft.typeName);

  const tagNames = draft.tagNames ?? [];
  const groupName = draft.groupNames?.[0] ?? null;
  const dueAt = draft.behaviorData?.Doable?.due_at?.trim() ?? '';

  const [notesOpen, setNotesOpen] = useState(Boolean(draft.content?.trim()) && !textPrimary);
  const [titleOpen, setTitleOpen] = useState(Boolean(draft.title.trim()) && textPrimary);
  const [groupOpen, setGroupOpen] = useState(Boolean(groupName));
  const [sheet, setSheet] = useState<'tags' | 'date' | null>(null);

  function setTypeName(typeName: ItemTypeName) {
    const optional = filterValidOptionalBehaviors(typeName, draft.optionalBehaviorNames ?? []);
    const next: CaptureItemDraft = {...draft, typeName, optionalBehaviorNames: optional};

    if (isTextPrimaryType(typeName) && !next.content?.trim() && draft.title.trim()) {
      next.content = draft.title;
      next.title = extractShortSubject(draft.title, typeName);
    }

    onChange(next);
  }

  function setDue(value: string) {
    onChange({
      ...draft,
      behaviorData: {
        ...draft.behaviorData,
        Doable: {
          ...getDefaultFieldValues('Doable'),
          ...(draft.behaviorData?.Doable ?? {}),
          due_at: value,
        },
      },
    });
  }

  return (
    <View style={{gap: 20}}>
      <View>
        <Label>Type</Label>
        <TypeDropdown value={draft.typeName} onChange={setTypeName} />
      </View>

      {textPrimary ? (
        <View>
          <Label>{bodyLabel}</Label>
          <TextInput
            value={draft.content ?? ''}
            onChangeText={(content) => onChange({...draft, content: content || null})}
            placeholder={`Write your ${bodyLabel.toLowerCase()}…`}
            placeholderTextColor={designTokens.textTertiary}
            multiline
            autoFocus={autoFocus}
            style={{...fieldStyle, minHeight: 160, lineHeight: 24, textAlignVertical: 'top'}}
          />

          {titleOpen ? (
            <TextInput
              value={draft.title}
              onChangeText={(title) => onChange({...draft, title})}
              placeholder="Short title"
              placeholderTextColor={designTokens.textTertiary}
              style={{...fieldStyle, marginTop: 10}}
            />
          ) : (
            <AddButton label="Add title" onPress={() => setTitleOpen(true)} />
          )}
        </View>
      ) : (
        <View>
          <Label>Title</Label>
          <TextInput
            value={draft.title}
            onChangeText={(title) => onChange({...draft, title})}
            placeholder="What needs doing?"
            placeholderTextColor={designTokens.textTertiary}
            autoFocus={autoFocus}
            style={fieldStyle}
          />

          {notesOpen ? (
            <TextInput
              value={draft.content ?? ''}
              onChangeText={(content) => onChange({...draft, content: content || null})}
              placeholder="Notes"
              placeholderTextColor={designTokens.textTertiary}
              multiline
              style={{...fieldStyle, marginTop: 10, minHeight: 90, lineHeight: 22, textAlignVertical: 'top'}}
            />
          ) : (
            <AddButton label="Add notes" onPress={() => setNotesOpen(true)} />
          )}
        </View>
      )}

      {isTask ? (
        <>
          <View>
            <Label>Due</Label>
            <Pressable
              onPress={() => setSheet('date')}
              accessibilityRole="button"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: designTokens.field,
                borderRadius: radius.md,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
              <Ionicons name="calendar-outline" size={18} color={designTokens.textSecondary} />
              <Text
                style={{
                  flex: 1,
                  color: dueAt ? designTokens.textPrimary : designTokens.textTertiary,
                  fontSize: 16,
                }}>
                {dueAt ? formatDayTimeSummary(dueAt) : 'No date'}
              </Text>
            </Pressable>
          </View>

          <View>
            <Label>Priority</Label>
            <View style={{flexDirection: 'row', gap: 8}}>
              {PRIORITIES.map((level) => (
                <SelectChip
                  key={level}
                  label={priorityLabel(level)}
                  active={priorityFromImportance(draft.importance ?? null) === level}
                  onPress={() => onChange({...draft, importance: PRIORITY_IMPORTANCE[level]})}
                />
              ))}
            </View>
          </View>
        </>
      ) : null}

      <View>
        {tagNames.length > 0 ? (
          <>
            <Label>Tags</Label>
            <Pressable
              onPress={() => setSheet('tags')}
              style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
              {tagNames.map((tag) => (
                <SelectChip key={tag} label={tag} active={false} onPress={() => setSheet('tags')} />
              ))}
            </Pressable>
          </>
        ) : (
          <AddButton label="Add tags" onPress={() => setSheet('tags')} />
        )}
      </View>

      <View>
        {groupOpen ? (
          groups.length === 0 ? (
            <Text style={{color: designTokens.textTertiary, fontSize: 14}}>
              No groups. Create one first.
            </Text>
          ) : (
            <>
              <Label>Group</Label>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                {groups.map((group) => (
                  <SelectChip
                    key={group.id}
                    label={group.name}
                    active={groupName === group.name}
                    onPress={() =>
                      onChange({
                        ...draft,
                        groupNames: groupName === group.name ? [] : [group.name],
                      })
                    }
                  />
                ))}
              </View>
            </>
          )
        ) : (
          <AddButton label="Add to group" onPress={() => setGroupOpen(true)} />
        )}
      </View>

      <TagsSheet
        visible={sheet === 'tags'}
        onClose={() => setSheet(null)}
        selected={tagNames}
        onSubmit={(names) => onChange({...draft, tagNames: names})}
      />

      <DateSheet
        visible={sheet === 'date'}
        onClose={() => setSheet(null)}
        onSelect={setDue}
        onClear={dueAt ? () => setDue('') : undefined}
      />
    </View>
  );
}
