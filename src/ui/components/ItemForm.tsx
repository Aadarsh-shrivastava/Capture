import {Ionicons} from '@expo/vector-icons';
import {useState} from 'react';
import {Text, TextInput, View} from 'react-native';

import {Pressable} from '@/ui/HapticPressable';
import {type CaptureItemDraft} from '@/capture/captureItemDraft';
import {extractShortSubject} from '@/capture/captureTitle';
import {DateSheet} from '@/components/sheets/DateSheet';
import {OptionsSheet} from '@/components/sheets/OptionsSheet';
import {TagsSheet} from '@/components/sheets/TagsSheet';
import {getDefaultFieldValues} from '@/domain/behaviorDefinitions';
import {
  filterValidOptionalBehaviors,
  typeAllowsBehavior,
} from '@/domain/behaviorTypeConfig';
import {GROUPS_ENABLED} from '@/groups';
import type {Group} from '@/models/group';
import {BEHAVIOR_FIELDS} from '@/behaviors';
import {
  priorityFromImportance,
  priorityLabel,
  PRIORITY_IMPORTANCE,
  URGENT_THRESHOLD,
  URGENT_VALUE,
  type PriorityLevel,
} from '@/services/itemDetailService';
import {SelectChip} from '@/ui/components/Primitives';
import {SelectField} from '@/ui/components/SelectField';
import {designTokens, radius} from '@/ui/designTokens';
import {formatDayTimeSummary} from '@/ui/formatDateTime';
import {
  getBodyFieldLabel,
  getItemTypeConfig,
  isTextPrimaryType,
  allTypeNames,
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
    <Text
      style={{color: designTokens.textTertiary, fontSize: 13, marginBottom: 8}}>
      {children}
    </Text>
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
      <Text style={{color: designTokens.textSecondary, fontSize: 15}}>
        {label}
      </Text>
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
  return (
    <SelectField
      title="Type"
      options={allTypeNames().map(name => ({
        label: getItemTypeConfig(name).label,
        value: name,
        icon: getItemTypeConfig(name).icon,
      }))}
      value={value}
      onChange={onChange}
    />
  );
}

/** The single item form — used by manual create/edit and by capture review. */
export function ItemForm({draft, onChange, groups, autoFocus = false}: Props) {
  const allows = (behavior: string) =>
    typeAllowsBehavior(draft.typeName, behavior);
  const isTask = allows('Doable');
  const textPrimary = isTextPrimaryType(draft.typeName);
  const bodyLabel = getBodyFieldLabel(draft.typeName);

  const tagNames = draft.tagNames ?? [];
  const groupName = draft.groupNames?.[0] ?? null;
  const dueAt = draft.behaviorData?.Doable?.due_at?.trim() ?? '';

  const [notesOpen, setNotesOpen] = useState(
    Boolean(draft.content?.trim()) && !textPrimary,
  );
  const [titleOpen, setTitleOpen] = useState(
    Boolean(draft.title.trim()) && textPrimary,
  );
  const [sheet, setSheet] = useState<'tags' | 'date' | 'group' | null>(null);

  function setTypeName(typeName: ItemTypeName) {
    const optional = filterValidOptionalBehaviors(
      typeName,
      draft.optionalBehaviorNames ?? [],
    );
    const next: CaptureItemDraft = {
      ...draft,
      typeName,
      optionalBehaviorNames: optional,
    };

    if (
      isTextPrimaryType(typeName) &&
      !next.content?.trim() &&
      draft.title.trim()
    ) {
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
            onChangeText={content =>
              onChange({...draft, content: content || null})
            }
            placeholder={`Write your ${bodyLabel.toLowerCase()}…`}
            placeholderTextColor={designTokens.textTertiary}
            multiline
            autoFocus={autoFocus}
            style={{
              ...fieldStyle,
              minHeight: 160,
              lineHeight: 24,
              textAlignVertical: 'top',
            }}
          />

          {titleOpen ? (
            <TextInput
              value={draft.title}
              onChangeText={title => onChange({...draft, title})}
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
            onChangeText={title => onChange({...draft, title})}
            placeholder="What needs doing?"
            placeholderTextColor={designTokens.textTertiary}
            autoFocus={autoFocus}
            style={fieldStyle}
          />

          {notesOpen ? (
            <TextInput
              value={draft.content ?? ''}
              onChangeText={content =>
                onChange({...draft, content: content || null})
              }
              placeholder="Notes"
              placeholderTextColor={designTokens.textTertiary}
              multiline
              style={{
                ...fieldStyle,
                marginTop: 10,
                minHeight: 90,
                lineHeight: 22,
                textAlignVertical: 'top',
              }}
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
              <Ionicons
                name="calendar-outline"
                size={18}
                color={designTokens.textSecondary}
              />
              <Text
                style={{
                  flex: 1,
                  color: dueAt
                    ? designTokens.textPrimary
                    : designTokens.textTertiary,
                  fontSize: 16,
                }}>
                {dueAt ? formatDayTimeSummary(dueAt) : 'No date'}
              </Text>
            </Pressable>
          </View>

          <View>
            <Label>Priority</Label>
            <SelectField
              title="Priority"
              icon="flag-outline"
              options={PRIORITIES.map(level => ({
                label: priorityLabel(level),
                value: level,
              }))}
              value={priorityFromImportance(draft.importance ?? null)}
              onChange={level =>
                onChange({
                  ...draft,
                  importance: PRIORITY_IMPORTANCE[level as PriorityLevel],
                })
              }
            />
          </View>

          <View>
            <Label>Urgency</Label>
            <SelectField
              title="Urgency"
              icon="alert-circle-outline"
              options={[
                {label: 'Not urgent', value: 'no'},
                {label: 'Urgent', value: 'yes'},
              ]}
              value={(draft.urgency ?? 0) >= URGENT_THRESHOLD ? 'yes' : 'no'}
              onChange={v =>
                onChange({...draft, urgency: v === 'yes' ? URGENT_VALUE : null})
              }
            />
          </View>
        </>
      ) : null}

      {/* One field per behavior this type allows (registry in src/behaviors/fields.ts). */}
      {BEHAVIOR_FIELDS.filter(
        b => allows(b.behavior) && (!b.needsDoable || isTask),
      ).map(({behavior, label, Field}) => (
        <View key={behavior}>
          <Label>{label}</Label>
          <Field draft={draft} onChange={onChange} />
        </View>
      ))}

      <View>
        {tagNames.length > 0 ? (
          <>
            <Label>Tags</Label>
            <Pressable
              onPress={() => setSheet('tags')}
              style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
              {tagNames.map(tag => (
                <SelectChip
                  key={tag}
                  label={tag}
                  active={false}
                  onPress={() => setSheet('tags')}
                />
              ))}
            </Pressable>
          </>
        ) : (
          <AddButton label="Add tags" onPress={() => setSheet('tags')} />
        )}
      </View>

      {GROUPS_ENABLED ? (
        <View>
          <Label>Group</Label>
          <Pressable
            onPress={() => setSheet('group')}
            disabled={groups.length === 0}
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
            <Ionicons
              name="folder-outline"
              size={18}
              color={designTokens.textSecondary}
            />
            <Text
              style={{
                flex: 1,
                color: groupName
                  ? designTokens.textPrimary
                  : designTokens.textTertiary,
                fontSize: 16,
              }}>
              {groups.length === 0 ? 'No groups yet' : groupName ?? 'No group'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={designTokens.textTertiary}
            />
          </Pressable>
        </View>
      ) : null}

      <TagsSheet
        visible={sheet === 'tags'}
        onClose={() => setSheet(null)}
        selected={tagNames}
        onSubmit={names => onChange({...draft, tagNames: names})}
      />

      <OptionsSheet
        visible={sheet === 'group'}
        onClose={() => setSheet(null)}
        title="Group"
        value={groupName ?? ''}
        options={[
          {label: 'No group', value: ''},
          ...groups.map(g => ({label: g.name, value: g.name})),
        ]}
        onSelect={name => onChange({...draft, groupNames: name ? [name] : []})}
      />

      <DateSheet
        visible={sheet === 'date'}
        onClose={() => setSheet(null)}
        onSelect={setDue}
        withTime
        onClear={dueAt ? () => setDue('') : undefined}
      />
    </View>
  );
}
